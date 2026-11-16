import {
  InventoryMovementType,
  ProductStatus,
  SellerOrderStatus,
  type PrismaClient,
} from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { InventoryService } from "@/services/inventory/inventory-service";
import { AuditService } from "@/services/audit/audit-service";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sellerId(actor: Actor) {
  if (!actor.roles.includes("SELLER") || !actor.sellerId)
    throw new Error("A conta não tem um perfil de vendedor ativo.");
  return actor.sellerId;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type SellerProductImageInput = { storageKey: string; alt: string };

function sellerProductPrices(
  normalPriceCents: number,
  promoPriceCents: number,
) {
  if (
    !Number.isSafeInteger(normalPriceCents) ||
    normalPriceCents < 1 ||
    normalPriceCents > 100_000_000
  )
    throw new Error("Indique um preço normal válido.");
  if (promoPriceCents === 0)
    return { priceCents: normalPriceCents, compareAtPriceCents: null };
  if (
    !Number.isSafeInteger(promoPriceCents) ||
    promoPriceCents < 1 ||
    promoPriceCents >= normalPriceCents
  )
    throw new Error("O preço promocional deve ser menor que o preço normal.");
  return {
    priceCents: promoPriceCents,
    compareAtPriceCents: normalPriceCents,
  };
}

function validateSellerImages(images: SellerProductImageInput[]) {
  if (images.length > 4)
    throw new Error("Pode enviar no máximo quatro fotos por vez.");
  for (const image of images) {
    if (
      image.storageKey.length > 2_100_000 ||
      !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        image.storageKey,
      )
    )
      throw new Error("Uma das fotos não tem um formato suportado.");
  }
}

export class SellerService {
  constructor(private readonly db: PrismaClient) {}

  async dashboard(actor: Actor) {
    const id = sellerId(actor);
    const [seller, products, orders, commissions] = await Promise.all([
      this.db.seller.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          businessName: true,
          legalName: true,
          status: true,
          phone: true,
          province: true,
          district: true,
          addressText: true,
          description: true,
          commissionBpsOverride: true,
        },
      }),
      this.db.product.findMany({
        where: { sellerId: id, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          brand: true,
          status: true,
          isFeatured: true,
          rejectionReason: true,
          category: { select: { name: true } },
          images: {
            select: { id: true, storageKey: true, alt: true },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          },
          variants: {
            where: { deletedAt: null },
            select: {
              id: true,
              label: true,
              sku: true,
              unit: true,
              unitSize: true,
              priceCents: true,
              compareAtPriceCents: true,
              lowStockThreshold: true,
              inventory: {
                select: { quantityOnHand: true, quantityReserved: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      this.db.sellerOrder.findMany({
        where: { sellerId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          status: true,
          subtotalCents: true,
          sellerNetCents: true,
          createdAt: true,
          order: {
            select: {
              number: true,
              contactPhone: true,
              shippingAddressSnapshot: true,
            },
          },
          items: {
            select: {
              productName: true,
              variantLabel: true,
              quantity: true,
              lineTotalCents: true,
            },
          },
        },
      }),
      this.db.commission.aggregate({
        where: { sellerId: id },
        _sum: { netCents: true, commissionCents: true },
        _count: true,
      }),
    ]);
    if (!seller) throw new Error("Perfil de vendedor não encontrado.");
    return { seller, products, orders, commissions };
  }

  async createProduct(
    actor: Actor,
    input: {
      name: string;
      description: string;
      brand: string;
      categoryId: string;
      label: string;
      unit: string;
      unitSize: number;
      normalPriceCents: number;
      promoPriceCents: number;
      lowStockThreshold: number;
      sku: string;
      startingStock: number;
      isFeatured: boolean;
      images: SellerProductImageInput[];
    },
  ) {
    const id = sellerId(actor);
    const name = input.name.trim();
    const label = input.label.trim();
    const sku = input.sku.trim().toUpperCase();
    if (
      name.length < 3 ||
      name.length > 120 ||
      !label ||
      label.length > 120 ||
      !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(sku) ||
      !uuid.test(input.categoryId)
    )
      throw new Error("Preencha os campos obrigatórios do produto.");
    if (input.brand.length > 100 || input.description.length > 2000)
      throw new Error("Marca ou descrição excede o limite permitido.");
    if (
      !Number.isSafeInteger(input.startingStock) ||
      input.startingStock < 0 ||
      input.startingStock > 1_000_000 ||
      !Number.isSafeInteger(input.lowStockThreshold) ||
      input.lowStockThreshold < 0 ||
      input.lowStockThreshold > 1_000_000 ||
      !Number.isFinite(input.unitSize) ||
      input.unitSize <= 0 ||
      input.unitSize > 1_000_000
    )
      throw new Error("Preço, quantidade e unidade precisam ser válidos.");
    const prices = sellerProductPrices(
      input.normalPriceCents,
      input.promoPriceCents,
    );
    validateSellerImages(input.images);
    if (
      !(["KG", "G", "L", "ML", "BAG", "UNIT", "BOX"] as string[]).includes(
        input.unit,
      )
    )
      throw new Error("Unidade inválida.");
    const [seller, category] = await Promise.all([
      this.db.seller.findFirst({
        where: { id, deletedAt: null },
        select: { status: true },
      }),
      this.db.category.findFirst({
        where: { id: input.categoryId, isActive: true, deletedAt: null },
        select: { id: true, requiresReview: true },
      }),
    ]);
    if (!seller || seller.status !== "APPROVED")
      throw new Error(
        "O perfil precisa estar aprovado para publicar produtos.",
      );
    if (!category) throw new Error("Escolha uma categoria ativa.");
    const slugBase = slugify(name) || "produto";
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
    const status = category.requiresReview
      ? ProductStatus.PENDING_REVIEW
      : ProductStatus.PENDING_REVIEW;
    await this.db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sellerId: id,
          categoryId: category.id,
          name,
          slug,
          description: input.description.trim() || null,
          brand: input.brand.trim() || null,
          status,
          isFeatured: input.isFeatured,
          variants: {
            create: {
              sku,
              label,
              unit: input.unit as
                "KG" | "G" | "L" | "ML" | "BAG" | "UNIT" | "BOX",
              unitSize: input.unitSize,
              ...prices,
              lowStockThreshold: input.lowStockThreshold,
              isDefault: true,
            },
          },
          images: {
            create: input.images.map((image, index) => ({
              storageKey: image.storageKey,
              alt: image.alt.slice(0, 200) || name,
              sortOrder: index,
              isPrimary: index === 0,
            })),
          },
        },
        select: { variants: { select: { id: true } } },
      });
      const variantId = product.variants[0]!.id;
      await tx.inventory.create({
        data: {
          variantId,
          quantityOnHand: input.startingStock,
          quantityReserved: 0,
        },
      });
      if (input.startingStock > 0)
        await tx.inventoryMovement.create({
          data: {
            variantId,
            type: InventoryMovementType.IN,
            quantity: input.startingStock,
            balanceAfter: input.startingStock,
            reason: "Stock inicial",
            actorUserId: actor.userId,
          },
        });
    });
  }

  async adjustStock(
    actor: Actor,
    variantId: string,
    quantity: number,
    reason: string,
  ) {
    const id = sellerId(actor);
    if (
      !uuid.test(variantId) ||
      !Number.isSafeInteger(quantity) ||
      quantity === 0 ||
      Math.abs(quantity) > 100_000
    )
      throw new Error("Ajuste de stock inválido.");
    const variant = await this.db.productVariant.findFirst({
      where: {
        id: variantId,
        deletedAt: null,
        product: { sellerId: id, deletedAt: null },
      },
      select: { id: true },
    });
    if (!variant) throw new Error("Variante não encontrada neste catálogo.");
    await new InventoryService(this.db).move({
      variantId,
      type: InventoryMovementType.ADJUSTMENT,
      quantity,
      reason: reason.trim().slice(0, 180) || "Ajuste pelo vendedor",
      actorUserId: actor.userId,
    });
  }

  async updateProduct(
    actor: Actor,
    input: {
      productId: string;
      variantId: string;
      name: string;
      description: string;
      brand: string;
      categoryId: string;
      label: string;
      sku: string;
      unit: string;
      unitSize: number;
      normalPriceCents: number;
      promoPriceCents: number;
      lowStockThreshold: number;
      images: SellerProductImageInput[];
      replaceImages: boolean;
    },
  ) {
    const id = sellerId(actor);
    if (
      !uuid.test(input.productId) ||
      !uuid.test(input.variantId) ||
      !uuid.test(input.categoryId)
    )
      throw new Error("Produto inválido.");
    const name = input.name.trim();
    const sku = input.sku.trim().toUpperCase();
    if (
      name.length < 3 ||
      name.length > 120 ||
      !input.label.trim() ||
      input.label.trim().length > 120 ||
      input.brand.length > 100 ||
      input.description.length > 2000 ||
      !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(sku) ||
      !(["KG", "G", "L", "ML", "BAG", "UNIT", "BOX"] as string[]).includes(
        input.unit,
      ) ||
      !Number.isFinite(input.unitSize) ||
      input.unitSize <= 0 ||
      input.unitSize > 1_000_000 ||
      !Number.isSafeInteger(input.lowStockThreshold) ||
      input.lowStockThreshold < 0 ||
      input.lowStockThreshold > 1_000_000
    )
      throw new Error("Revise os dados, a unidade, o SKU e os preços.");
    const prices = sellerProductPrices(
      input.normalPriceCents,
      input.promoPriceCents,
    );
    validateSellerImages(input.images);
    const [owned, category] = await Promise.all([
      this.db.product.findFirst({
        where: {
          id: input.productId,
          sellerId: id,
          deletedAt: null,
          variants: { some: { id: input.variantId, deletedAt: null } },
        },
        select: { id: true },
      }),
      this.db.category.findFirst({
        where: { id: input.categoryId, isActive: true, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!owned) throw new Error("Produto não encontrado neste catálogo.");
    if (!category) throw new Error("Categoria inativa ou inválida.");
    const skuConflict = await this.db.productVariant.findUnique({
      where: { sku },
      select: { id: true },
    });
    if (skuConflict && skuConflict.id !== input.variantId)
      throw new Error("Este SKU já está a ser usado por outro produto.");
    await this.db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: owned.id },
        data: {
          name,
          categoryId: category.id,
          description: input.description.trim() || null,
          brand: input.brand.trim() || null,
          status: ProductStatus.PENDING_REVIEW,
          reviewedAt: null,
          reviewedById: null,
          rejectionReason: null,
        },
      });
      await tx.productVariant.update({
        where: { id: input.variantId },
        data: {
          label: input.label.trim(),
          sku,
          unit: input.unit as "KG" | "G" | "L" | "ML" | "BAG" | "UNIT" | "BOX",
          unitSize: input.unitSize,
          ...prices,
          lowStockThreshold: input.lowStockThreshold,
        },
      });
      if (input.replaceImages) {
        await tx.productImage.deleteMany({ where: { productId: owned.id } });
        if (input.images.length)
          await tx.productImage.createMany({
            data: input.images.map((image, index) => ({
              productId: owned.id,
              storageKey: image.storageKey,
              alt: image.alt.slice(0, 200) || name,
              sortOrder: index,
              isPrimary: index === 0,
            })),
          });
      }
    });
  }

  async setProductActive(actor: Actor, productId: string, active: boolean) {
    const id = sellerId(actor);
    if (!uuid.test(productId)) throw new Error("Produto inválido.");
    const product = await this.db.product.findFirst({
      where: { id: productId, sellerId: id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!product) throw new Error("Produto não encontrado neste catálogo.");
    if (active) {
      const seller = await this.db.seller.findFirst({
        where: { id, status: "APPROVED", deletedAt: null },
        select: { id: true },
      });
      if (!seller)
        throw new Error(
          "A loja precisa estar aprovada para reativar produtos.",
        );
      if (product.status !== ProductStatus.INACTIVE)
        throw new Error("Este produto não está suspenso.");
      await this.db.product.update({
        where: { id: product.id },
        data: {
          status: ProductStatus.PENDING_REVIEW,
          reviewedAt: null,
          reviewedById: null,
          rejectionReason: null,
        },
      });
      return;
    }
    if (product.status === ProductStatus.INACTIVE)
      throw new Error("Este produto já está suspenso.");
    if (product.status === ProductStatus.ARCHIVED)
      throw new Error("Um produto arquivado não pode ser suspenso.");
    await this.db.product.update({
      where: { id: product.id },
      data: { status: ProductStatus.INACTIVE },
    });
  }

  async setProductFeatured(
    actor: Actor,
    productId: string,
    isFeatured: boolean,
  ) {
    const id = sellerId(actor);
    if (!uuid.test(productId)) throw new Error("Produto inválido.");
    const product = await this.db.product.findFirst({
      where: { id: productId, sellerId: id, deletedAt: null },
      select: { id: true, name: true, isFeatured: true },
    });
    if (!product) throw new Error("Produto não encontrado neste catálogo.");
    if (product.isFeatured === isFeatured) return;
    await this.db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { isFeatured },
      });
      await new AuditService(tx as unknown as PrismaClient).log({
        action: isFeatured
          ? "product.featured_by_seller"
          : "product.unfeatured_by_seller",
        entityType: "Product",
        entityId: product.id,
        before: { name: product.name, isFeatured: product.isFeatured },
        after: { name: product.name, isFeatured },
        actor,
      });
    });
  }

  async updateProfile(
    actor: Actor,
    input: {
      businessName: string;
      legalName: string;
      phone: string;
      province: string;
      district: string;
      addressText: string;
      description: string;
    },
  ) {
    const id = sellerId(actor);
    const businessName = input.businessName.trim();
    const phone = input.phone.trim();
    if (
      businessName.length < 2 ||
      businessName.length > 160 ||
      input.legalName.length > 160 ||
      phone.length < 7 ||
      phone.length > 32 ||
      input.description.length > 2000 ||
      !input.province.trim() ||
      !input.district.trim() ||
      !input.addressText.trim()
    )
      throw new Error("Preencha nome comercial, telefone e endereço.");
    await this.db.seller.update({
      where: { id },
      data: {
        businessName,
        legalName: input.legalName.trim() || null,
        phone,
        province: input.province.trim(),
        district: input.district.trim(),
        addressText: input.addressText.trim(),
        description: input.description.trim() || null,
      },
    });
  }

  async updateOrder(
    actor: Actor,
    orderId: string,
    next: "CONFIRMED" | "REJECTED" | "READY_FOR_PICKUP",
    reason = "",
  ) {
    const id = sellerId(actor);
    if (!uuid.test(orderId)) throw new Error("Encomenda inválida.");
    const order = await this.db.sellerOrder.findFirst({
      where: { id: orderId, sellerId: id },
      select: {
        id: true,
        orderId: true,
        status: true,
        items: { select: { variantId: true } },
      },
    });
    if (!order) throw new Error("Encomenda não encontrada.");
    const allowed =
      (order.status === SellerOrderStatus.PENDING &&
        ["CONFIRMED", "REJECTED"].includes(next)) ||
      (order.status === SellerOrderStatus.CONFIRMED &&
        next === "READY_FOR_PICKUP");
    if (!allowed) throw new Error("Esta transição de estado não é permitida.");
    await this.db.$transaction(async (tx) => {
      if (next === "REJECTED") {
        const reservations = await tx.stockReservation.findMany({
          where: {
            orderId: order.orderId,
            variantId: { in: order.items.map((item) => item.variantId) },
            status: "ACTIVE",
          },
          select: { id: true },
        });
        const inventory = new InventoryService(this.db);
        for (const reservation of reservations) {
          await inventory.releaseReservationInTransaction(tx, reservation.id);
        }
      }
      await tx.sellerOrder.update({
        where: { id: order.id },
        data: {
          status: next,
          ...(next === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
          ...(next === "READY_FOR_PICKUP" ? { readyAt: new Date() } : {}),
          ...(next === "REJECTED"
            ? {
                rejectionReason:
                  reason.trim().slice(0, 240) || "Recusada pelo vendedor",
              }
            : {}),
        },
      });
      if (next === "REJECTED") {
        const remaining = await tx.sellerOrder.count({
          where: {
            orderId: order.orderId,
            status: { notIn: ["REJECTED", "CANCELLED"] },
            id: { not: order.id },
          },
        });
        if (!remaining) {
          await tx.order.update({
            where: { id: order.orderId },
            data: {
              status: "CANCELLED",
              cancelledAt: new Date(),
              cancelReason: "Todos os vendedores recusaram o pedido.",
            },
          });
          await tx.payment.updateMany({
            where: { orderId: order.orderId, status: "PENDING_COLLECTION" },
            data: { status: "CANCELLED" },
          });
        }
      }
      await new AuditService(tx as unknown as PrismaClient).log({
        action: `seller_order.${next.toLowerCase()}`,
        entityType: "SellerOrder",
        entityId: order.id,
        before: { status: order.status },
        after: { status: next },
        actor,
      });
    });
  }
}
