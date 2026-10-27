import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { displayName } from "@/lib/display-name";

const MAX_LINE_QUANTITY = 99;
const GUEST_CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type CartDb = PrismaClient | Prisma.TransactionClient;

export type CartOwner =
  | { userId: string; anonymousTokenHash?: never }
  | { userId?: never; anonymousTokenHash: string };

export type CartItemView = {
  id: string;
  variantId: string;
  productSlug: string;
  productName: string;
  productBrand: string | null;
  sellerId: string;
  sellerName: string;
  variantLabel: string;
  priceCents: number;
  quantity: number;
  available: number;
  imageUrl: string | null;
  imageAlt: string | null;
  lineTotalCents: number;
};

export type CartSellerGroup = {
  sellerId: string;
  sellerName: string;
  items: CartItemView[];
  subtotalCents: number;
};

export type CartSnapshot = {
  groups: CartSellerGroup[];
  itemCount: number;
  totalCents: number;
};

export type CartMutationResult =
  | { ok: true; available?: number }
  | { ok: false; error: string; available?: number };

const cartItemViewSelect = {
  id: true,
  variantId: true,
  quantity: true,
  variant: {
    select: {
      label: true,
      priceCents: true,
      inventory: {
        select: { quantityOnHand: true, quantityReserved: true },
      },
      product: {
        select: {
          slug: true,
          name: true,
          brand: true,
          category: { select: { isActive: true, deletedAt: true } },
          seller: {
            select: {
              id: true,
              businessName: true,
              status: true,
              deletedAt: true,
              user: { select: { status: true, deletedAt: true } },
            },
          },
          images: {
            select: {
              storageKey: true,
              alt: true,
              sortOrder: true,
              isPrimary: true,
            },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
          },
        },
      },
    },
  },
} satisfies Prisma.CartItemSelect;

type CartItemRecord = Prisma.CartItemGetPayload<{
  select: typeof cartItemViewSelect;
}>;

function safeImageUrl(storageKey: string): string | null {
  if (storageKey.startsWith("/") && !storageKey.startsWith("//"))
    return storageKey;
  try {
    const url = new URL(storageKey);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function isPublicItem(item: CartItemRecord) {
  const product = item.variant.product;
  return (
    item.variant.product.category.isActive &&
    !item.variant.product.category.deletedAt &&
    product.seller.status === "APPROVED" &&
    !product.seller.deletedAt &&
    product.seller.user.status === "ACTIVE" &&
    !product.seller.user.deletedAt
  );
}

function snapshot(items: CartItemRecord[]): CartSnapshot {
  const groups = new Map<string, CartSellerGroup>();
  let itemCount = 0;
  let totalCents = 0;
  for (const item of items) {
    if (!isPublicItem(item)) continue;
    const product = item.variant.product;
    const seller = product.seller;
    const stock = item.variant.inventory;
    const available = Math.max(
      0,
      (stock?.quantityOnHand ?? 0) - (stock?.quantityReserved ?? 0),
    );
    const image = product.images[0];
    const lineTotalCents = item.variant.priceCents * item.quantity;
    const view: CartItemView = {
      id: item.id,
      variantId: item.variantId,
      productSlug: product.slug,
      productName: displayName(product.name),
      productBrand: product.brand ? displayName(product.brand) : null,
      sellerId: seller.id,
      sellerName: displayName(seller.businessName),
      variantLabel: displayName(item.variant.label),
      priceCents: item.variant.priceCents,
      quantity: item.quantity,
      available,
      imageUrl: image ? safeImageUrl(image.storageKey) : null,
      imageAlt: image?.alt ? displayName(image.alt) : null,
      lineTotalCents,
    };
    let group = groups.get(seller.id);
    if (!group) {
      group = {
        sellerId: seller.id,
        sellerName: displayName(seller.businessName),
        items: [],
        subtotalCents: 0,
      };
      groups.set(seller.id, group);
    }
    group.items.push(view);
    group.subtotalCents += lineTotalCents;
    itemCount += item.quantity;
    totalCents += lineTotalCents;
  }
  return { groups: [...groups.values()], itemCount, totalCents };
}

export class CartService {
  constructor(private readonly db: CartDb) {}

  private transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { isolationLevel: Prisma.TransactionIsolationLevel },
  ) {
    const root = this.db as PrismaClient;
    if (typeof root.$transaction === "function")
      return root.$transaction(callback, options);
    return callback(this.db as Prisma.TransactionClient);
  }

  async getOrCreateUserCart(userId: string) {
    return this.db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });
  }

  async getOrCreateGuestCart(anonymousTokenHash: string) {
    return this.db.cart.upsert({
      where: { anonymousToken: anonymousTokenHash },
      create: {
        anonymousToken: anonymousTokenHash,
        expiresAt: new Date(Date.now() + GUEST_CART_TTL_MS),
      },
      update: { expiresAt: new Date(Date.now() + GUEST_CART_TTL_MS) },
      select: { id: true },
    });
  }

  async read(owner: CartOwner): Promise<CartSnapshot> {
    const cart = await this.db.cart.findFirst({
      where:
        owner.userId !== undefined
          ? { userId: owner.userId }
          : {
              anonymousToken: owner.anonymousTokenHash,
              expiresAt: { gt: new Date() },
            },
      select: {
        items: {
          where: {
            variant: {
              isActive: true,
              deletedAt: null,
              product: { status: "ACTIVE", deletedAt: null },
            },
          },
          select: cartItemViewSelect,
          orderBy: { id: "asc" },
        },
      },
    });
    return cart
      ? snapshot(cart.items)
      : { groups: [], itemCount: 0, totalCents: 0 };
  }

  async addItem(
    cartId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartMutationResult> {
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_LINE_QUANTITY
    )
      return { ok: false, error: "Escolha uma quantidade entre 1 e 99." };

    return this.transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "product_variants" WHERE "id" = ${variantId}::uuid FOR UPDATE
      `);
      const variant = await tx.productVariant.findFirst({
        where: {
          id: variantId,
          isActive: true,
          deletedAt: null,
          product: {
            status: "ACTIVE",
            deletedAt: null,
            category: { isActive: true, deletedAt: null },
            seller: {
              status: "APPROVED",
              deletedAt: null,
              user: { status: "ACTIVE", deletedAt: null },
            },
          },
        },
        select: {
          id: true,
          inventory: {
            select: { quantityOnHand: true, quantityReserved: true },
          },
        },
      });
      if (!variant)
        return { ok: false, error: "Esta opção já não está disponível." };
      const available = Math.max(
        0,
        (variant.inventory?.quantityOnHand ?? 0) -
          (variant.inventory?.quantityReserved ?? 0),
      );
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId, variantId } },
        select: { quantity: true },
      });
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (nextQuantity > MAX_LINE_QUANTITY)
        return { ok: false, error: "O máximo por opção são 99 unidades." };
      if (nextQuantity > available)
        return {
          ok: false,
          error:
            available === 0
              ? "Esta opção está sem stock disponível."
              : `Só há ${available} unidade${available === 1 ? "" : "s"} disponível${available === 1 ? "" : "e"}.`,
          available,
        };
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId, variantId } },
        create: { cartId, variantId, quantity },
        update: { quantity: nextQuantity },
      });
      return { ok: true, available };
    });
  }

  async setQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartMutationResult> {
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_LINE_QUANTITY
    )
      return { ok: false, error: "Escolha uma quantidade entre 1 e 99." };
    const existingItem = await this.db.cartItem.findFirst({
      where: { id: itemId, cartId },
      select: { variantId: true },
    });
    if (!existingItem)
      return { ok: false, error: "Este artigo já não está no carrinho." };

    return this.transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "product_variants" WHERE "id" = ${existingItem.variantId}::uuid FOR UPDATE
      `);
      const variant = await tx.productVariant.findFirst({
        where: {
          id: existingItem.variantId,
          isActive: true,
          deletedAt: null,
          product: {
            status: "ACTIVE",
            deletedAt: null,
            category: { isActive: true, deletedAt: null },
            seller: {
              status: "APPROVED",
              deletedAt: null,
              user: { status: "ACTIVE", deletedAt: null },
            },
          },
        },
        select: {
          inventory: {
            select: { quantityOnHand: true, quantityReserved: true },
          },
        },
      });
      if (!variant)
        return { ok: false, error: "Esta opção já não está disponível." };
      const available = Math.max(
        0,
        (variant.inventory?.quantityOnHand ?? 0) -
          (variant.inventory?.quantityReserved ?? 0),
      );
      if (quantity > available)
        return {
          ok: false,
          error:
            available === 0
              ? "Esta opção está sem stock disponível."
              : `Só há ${available} unidade${available === 1 ? "" : "s"} disponível${available === 1 ? "" : "e"}.`,
          available,
        };
      const result = await tx.cartItem.updateMany({
        where: { id: itemId, cartId },
        data: { quantity },
      });
      return result.count
        ? { ok: true, available }
        : { ok: false, error: "Este artigo já não está no carrinho." };
    });
  }

  async removeItem(cartId: string, itemId: string) {
    const result = await this.db.cartItem.deleteMany({
      where: { id: itemId, cartId },
    });
    return result.count > 0;
  }

  async mergeGuestIntoUser(userId: string, anonymousTokenHash: string) {
    return this.transaction(
      async (tx) => {
        const userCart = await tx.cart.upsert({
          where: { userId },
          create: { userId },
          update: {},
          select: { id: true },
        });
        const guestCart = await tx.cart.findFirst({
          where: {
            anonymousToken: anonymousTokenHash,
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            items: { select: { variantId: true, quantity: true } },
          },
        });
        if (!guestCart || guestCart.id === userCart.id) return 0;
        const variantIds = guestCart.items.map((item) => item.variantId);
        const variants = variantIds.length
          ? await tx.productVariant.findMany({
              where: {
                id: { in: variantIds },
                isActive: true,
                deletedAt: null,
                product: {
                  status: "ACTIVE",
                  deletedAt: null,
                  category: { isActive: true, deletedAt: null },
                  seller: {
                    status: "APPROVED",
                    deletedAt: null,
                    user: { status: "ACTIVE", deletedAt: null },
                  },
                },
              },
              select: {
                id: true,
                inventory: {
                  select: { quantityOnHand: true, quantityReserved: true },
                },
              },
            })
          : [];
        const variantById = new Map(
          variants.map((variant) => [variant.id, variant]),
        );
        const currentItems = variantIds.length
          ? await tx.cartItem.findMany({
              where: { cartId: userCart.id, variantId: { in: variantIds } },
              select: { variantId: true, quantity: true },
            })
          : [];
        const currentByVariant = new Map(
          currentItems.map((item) => [item.variantId, item.quantity]),
        );
        let merged = 0;
        for (const guestItem of guestCart.items) {
          const variant = variantById.get(guestItem.variantId);
          if (!variant) continue;
          const available = Math.max(
            0,
            (variant.inventory?.quantityOnHand ?? 0) -
              (variant.inventory?.quantityReserved ?? 0),
          );
          if (!available) continue;
          const quantity = Math.min(
            MAX_LINE_QUANTITY,
            available,
            (currentByVariant.get(guestItem.variantId) ?? 0) +
              guestItem.quantity,
          );
          if (!quantity) continue;
          await tx.cartItem.upsert({
            where: {
              cartId_variantId: {
                cartId: userCart.id,
                variantId: guestItem.variantId,
              },
            },
            create: {
              cartId: userCart.id,
              variantId: guestItem.variantId,
              quantity,
            },
            update: { quantity },
          });
          merged += 1;
        }
        await tx.cart.delete({ where: { id: guestCart.id } });
        return merged;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
