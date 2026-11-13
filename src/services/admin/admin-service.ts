import {
  InventoryMovementType,
  ProductStatus,
  ProductUnit,
  type PrismaClient,
} from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { assertCan } from "@/lib/permissions";
import { productImagePublicUrl } from "@/lib/product-image-storage";
import {
  realAuditLogWhere,
  realCategoryWhere,
  realDeliveryWhere,
  realDriverWhere,
  realOrderWhere,
  realProductWhere,
  realSellerWhere,
} from "@/lib/real-data-filters";
import { AuditService } from "@/services/audit/audit-service";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const productUnits = Object.values(ProductUnit) as string[];
const productStatuses = Object.values(ProductStatus) as string[];

export type AdminProductImageInput = {
  storageKey: string;
  alt: string;
};

export type AdminCatalogManagementData = Awaited<
  ReturnType<AdminService["catalogManagement"]>
>;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateUploadedImages(images: AdminProductImageInput[]) {
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

function promotionPrices(normalPriceCents: number, promoPriceCents: number) {
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

export class AdminService {
  constructor(private readonly db: PrismaClient) {}

  private authorize(actor: Actor) {
    assertCan(actor, "order:read_all");
    return new AuditService(this.db);
  }

  async overview(actor: Actor) {
    this.authorize(actor);
    const [
      orders,
      sellers,
      products,
      drivers,
      deliveries,
      payments,
      recentOrders,
      pendingSellers,
      pendingProducts,
    ] = await Promise.all([
      this.db.order.count({ where: realOrderWhere }),
      this.db.seller.count({
        where: { AND: [{ deletedAt: null }, realSellerWhere] },
      }),
      this.db.product.count({ where: realProductWhere }),
      this.db.driver.count({ where: realDriverWhere }),
      this.db.delivery.count({ where: realDeliveryWhere }),
      this.db.payment.aggregate({
        where: { status: "PAID", order: { is: realOrderWhere } },
        _sum: { amountCents: true },
      }),
      this.db.order.findMany({
        where: realOrderWhere,
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          totalCents: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      this.db.seller.findMany({
        where: {
          AND: [{ status: "PENDING", deletedAt: null }, realSellerWhere],
        },
        take: 8,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          businessName: true,
          province: true,
          district: true,
          createdAt: true,
        },
      }),
      this.db.product.findMany({
        where: {
          AND: [{ status: "PENDING_REVIEW" }, realProductWhere],
        },
        take: 8,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          seller: { select: { businessName: true } },
          category: { select: { name: true } },
        },
      }),
    ]);
    return {
      stats: {
        orders,
        sellers,
        products,
        drivers,
        deliveries,
        paidCents: payments._sum.amountCents ?? 0,
      },
      recentOrders,
      pendingSellers,
      pendingProducts,
    };
  }

  async catalogManagement(actor: Actor) {
    this.authorize(actor);
    assertCan(actor, "product:update");
    const [products, categories, sellers] = await Promise.all([
      this.db.product.findMany({
        where: realProductWhere,
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          brand: true,
          status: true,
          categoryId: true,
          category: { select: { name: true } },
          seller: { select: { businessName: true } },
          images: {
            select: { id: true, storageKey: true, alt: true, isPrimary: true },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          },
          variants: {
            where: { deletedAt: null },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            select: {
              id: true,
              label: true,
              sku: true,
              unit: true,
              unitSize: true,
              priceCents: true,
              compareAtPriceCents: true,
              isDefault: true,
              inventory: {
                select: { quantityOnHand: true, quantityReserved: true },
              },
            },
          },
        },
      }),
      this.db.category.findMany({
        where: realCategoryWhere,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, isActive: true },
      }),
      this.db.seller.findMany({
        where: {
          AND: [{ status: "APPROVED", deletedAt: null }, realSellerWhere],
        },
        orderBy: { businessName: "asc" },
        select: { id: true, businessName: true },
      }),
    ]);

    return {
      products: products.map(({ images, ...product }) => ({
        ...product,
        images: images.map(({ storageKey, ...image }) => ({
          ...image,
          url: productImagePublicUrl(storageKey, image.id),
        })),
        variants: product.variants.map((variant) => ({
          ...variant,
          unitSize: Number(variant.unitSize),
        })),
      })),
      categories,
      sellers,
    };
  }

  async createCatalogProduct(
    actor: Actor,
    input: {
      name: string;
      description: string;
      brand: string;
      sellerId: string;
      categoryId: string;
      status: string;
      label: string;
      sku: string;
      unit: string;
      unitSize: number;
      normalPriceCents: number;
      promoPriceCents: number;
      stock: number;
      images: AdminProductImageInput[];
    },
  ) {
    const audit = this.authorize(actor);
    assertCan(actor, "product:create");
    const name = input.name.trim();
    const brand = input.brand.trim();
    const description = input.description.trim();
    const label = input.label.trim();
    const sku = input.sku.trim().toUpperCase();
    if (
      name.length < 3 ||
      name.length > 120 ||
      brand.length > 100 ||
      description.length > 2000 ||
      label.length < 1 ||
      label.length > 120 ||
      !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(sku) ||
      !uuid.test(input.sellerId) ||
      !uuid.test(input.categoryId)
    )
      throw new Error("Revise os dados e os identificadores do produto.");
    if (
      !productUnits.includes(input.unit) ||
      !Number.isFinite(input.unitSize) ||
      input.unitSize <= 0 ||
      input.unitSize > 1_000_000 ||
      !Number.isSafeInteger(input.stock) ||
      input.stock < 0 ||
      input.stock > 1_000_000
    )
      throw new Error("Unidade, tamanho ou stock inválido.");
    if (!productStatuses.includes(input.status))
      throw new Error("Estado do produto inválido.");
    validateUploadedImages(input.images);
    const prices = promotionPrices(
      input.normalPriceCents,
      input.promoPriceCents,
    );

    const [seller, category] = await Promise.all([
      this.db.seller.findFirst({
        where: {
          AND: [
            { id: input.sellerId, status: "APPROVED", deletedAt: null },
            realSellerWhere,
          ],
        },
        select: { id: true },
      }),
      this.db.category.findFirst({
        where: { id: input.categoryId, isActive: true, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!seller) throw new Error("Escolha um vendedor aprovado.");
    if (!category) throw new Error("Escolha uma categoria ativa.");

    const status =
      input.status as (typeof ProductStatus)[keyof typeof ProductStatus];
    const slug = `${slugify(name) || "produto"}-${crypto.randomUUID().slice(0, 8)}`;
    const product = await this.db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          name,
          slug,
          description: description || null,
          brand: brand || null,
          status,
          reviewedAt: status === ProductStatus.ACTIVE ? new Date() : null,
          reviewedById: status === ProductStatus.ACTIVE ? actor.userId : null,
          variants: {
            create: {
              sku,
              label,
              unit: input.unit as (typeof ProductUnit)[keyof typeof ProductUnit],
              unitSize: input.unitSize,
              ...prices,
              isDefault: true,
              inventory: {
                create: {
                  quantityOnHand: input.stock,
                  quantityReserved: 0,
                },
              },
              ...(input.stock > 0
                ? {
                    inventoryMovements: {
                      create: {
                        type: InventoryMovementType.IN,
                        quantity: input.stock,
                        balanceAfter: input.stock,
                        reason: "Stock inicial definido pela administração",
                        actorUserId: actor.userId,
                      },
                    },
                  }
                : {}),
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
        select: { id: true },
      });
      return created;
    });

    await audit.log({
      action: "product.created_by_admin",
      entityType: "Product",
      entityId: product.id,
      after: { name, sellerId: seller.id, categoryId: category.id, status },
      actor,
    });
  }

  async updateCatalogProduct(
    actor: Actor,
    input: {
      productId: string;
      name: string;
      description: string;
      brand: string;
      categoryId: string;
      status: string;
      removeImageIds: string[];
      images: AdminProductImageInput[];
    },
  ) {
    const audit = this.authorize(actor);
    assertCan(actor, "product:update");
    if (!uuid.test(input.productId) || !uuid.test(input.categoryId))
      throw new Error("Produto ou categoria inválidos.");
    const name = input.name.trim();
    const description = input.description.trim();
    const brand = input.brand.trim();
    if (
      name.length < 3 ||
      name.length > 120 ||
      description.length > 2000 ||
      brand.length > 100
    )
      throw new Error("Revise o nome, a marca e a descrição.");
    if (!productStatuses.includes(input.status))
      throw new Error("Estado do produto inválido.");
    if (input.removeImageIds.some((id) => !uuid.test(id)))
      throw new Error("Uma das fotos selecionadas é inválida.");
    validateUploadedImages(input.images);
    const status =
      input.status as (typeof ProductStatus)[keyof typeof ProductStatus];

    const [product, category] = await Promise.all([
      this.db.product.findFirst({
        where: { AND: [{ id: input.productId }, realProductWhere] },
        select: { id: true, name: true, status: true },
      }),
      this.db.category.findFirst({
        where: { AND: [{ id: input.categoryId }, realCategoryWhere] },
        select: { id: true, isActive: true },
      }),
    ]);
    if (!product) throw new Error("Produto não encontrado no catálogo real.");
    if (!category) throw new Error("Escolha uma categoria válida.");
    if (status === ProductStatus.ACTIVE && !category.isActive)
      throw new Error("Active a categoria antes de publicar este produto.");

    await this.db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          name,
          categoryId: category.id,
          description: description || null,
          brand: brand || null,
          status,
          reviewedAt: status === ProductStatus.ACTIVE ? new Date() : null,
          reviewedById: status === ProductStatus.ACTIVE ? actor.userId : null,
          rejectionReason: null,
        },
      });
      if (input.removeImageIds.length) {
        await tx.productImage.deleteMany({
          where: {
            productId: product.id,
            id: { in: input.removeImageIds },
          },
        });
      }
      const remaining = await tx.productImage.findMany({
        where: { productId: product.id },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { id: true, isPrimary: true, sortOrder: true },
      });
      if (input.images.length) {
        const nextOrder = remaining.reduce(
          (maximum, image) => Math.max(maximum, image.sortOrder + 1),
          0,
        );
        await tx.productImage.createMany({
          data: input.images.map((image, index) => ({
            productId: product.id,
            storageKey: image.storageKey,
            alt: image.alt.slice(0, 200) || name,
            sortOrder: nextOrder + index,
            isPrimary: remaining.length === 0 && index === 0,
          })),
        });
      }
      if (remaining.length && !remaining.some((image) => image.isPrimary)) {
        await tx.productImage.update({
          where: { id: remaining[0]!.id },
          data: { isPrimary: true },
        });
      }
    });

    await audit.log({
      action: "product.updated_by_admin",
      entityType: "Product",
      entityId: product.id,
      before: { name: product.name, status: product.status },
      after: { name, categoryId: category.id, status },
      actor,
    });
  }

  async updateCatalogVariant(
    actor: Actor,
    input: {
      productId: string;
      variantId: string;
      label: string;
      sku: string;
      unit: string;
      unitSize: number;
      normalPriceCents: number;
      promoPriceCents: number;
      stock: number;
    },
  ) {
    const audit = this.authorize(actor);
    assertCan(actor, "product:update");
    if (!uuid.test(input.productId) || !uuid.test(input.variantId))
      throw new Error("Produto ou variante inválidos.");
    const label = input.label.trim();
    const sku = input.sku.trim().toUpperCase();
    if (
      label.length < 1 ||
      label.length > 120 ||
      !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(sku) ||
      !productUnits.includes(input.unit) ||
      !Number.isFinite(input.unitSize) ||
      input.unitSize <= 0 ||
      input.unitSize > 1_000_000 ||
      !Number.isSafeInteger(input.stock) ||
      input.stock < 0 ||
      input.stock > 1_000_000
    )
      throw new Error("Revise o SKU, a variante, a unidade e o stock.");
    const prices = promotionPrices(
      input.normalPriceCents,
      input.promoPriceCents,
    );
    const owned = await this.db.productVariant.findFirst({
      where: {
        id: input.variantId,
        productId: input.productId,
        deletedAt: null,
        product: { is: { AND: [{ id: input.productId }, realProductWhere] } },
      },
      select: { id: true, sku: true, priceCents: true },
    });
    if (!owned) throw new Error("Variante não encontrada no catálogo real.");

    await this.db.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id: owned.id },
        data: {
          label,
          sku,
          unit: input.unit as (typeof ProductUnit)[keyof typeof ProductUnit],
          unitSize: input.unitSize,
          ...prices,
        },
      });
      const inventory = await tx.inventory.upsert({
        where: { variantId: owned.id },
        create: {
          variantId: owned.id,
          quantityOnHand: 0,
          quantityReserved: 0,
        },
        update: {},
        select: { quantityOnHand: true },
      });
      const quantityDelta = input.stock - inventory.quantityOnHand;
      if (quantityDelta !== 0) {
        const changed = await tx.inventory.updateMany({
          where: {
            variantId: owned.id,
            quantityOnHand: inventory.quantityOnHand,
            quantityReserved: { lte: input.stock },
          },
          data: { quantityOnHand: input.stock },
        });
        if (!changed.count)
          throw new Error(
            "O stock reservado impede esta alteração. Actualize e tente novamente.",
          );
        await tx.inventoryMovement.create({
          data: {
            variantId: owned.id,
            type: InventoryMovementType.ADJUSTMENT,
            quantity: quantityDelta,
            balanceAfter: input.stock,
            reason: "Ajuste de stock pelo painel administrativo",
            actorUserId: actor.userId,
          },
        });
      }
    });

    await audit.log({
      action: "product.variant_updated_by_admin",
      entityType: "ProductVariant",
      entityId: owned.id,
      before: { sku: owned.sku, priceCents: owned.priceCents },
      after: {
        sku,
        priceCents: prices.priceCents,
        compareAtPriceCents: prices.compareAtPriceCents,
        stock: input.stock,
      },
      actor,
    });
  }

  async reviewSeller(
    actor: Actor,
    id: string,
    approved: boolean,
    reason?: string,
  ) {
    const audit = this.authorize(actor);
    assertCan(actor, "seller:approve");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Vendedor inválido.");
    const seller = await this.db.seller.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!seller || seller.status !== "PENDING")
      throw new Error("Este vendedor já foi analisado.");
    const status = approved ? "APPROVED" : "REJECTED";
    await this.db.$transaction(async (tx) => {
      await tx.seller.update({
        where: { id },
        data: { status, approvedAt: approved ? new Date() : null },
      });
      await tx.sellerApproval.create({
        data: {
          sellerId: id,
          decision: status,
          reason: approved
            ? null
            : reason?.slice(0, 500) || "Não cumpre os requisitos.",
          reviewerId: actor.userId,
        },
      });
      await audit.log({
        action: `seller.${status.toLowerCase()}`,
        entityType: "Seller",
        entityId: id,
        before: { status: seller.status },
        after: { status, reason: approved ? null : (reason ?? null) },
        actor,
      });
    });
  }

  async reviewProduct(
    actor: Actor,
    id: string,
    approved: boolean,
    reason?: string,
  ) {
    const audit = this.authorize(actor);
    assertCan(actor, "product:approve");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Produto inválido.");
    const product = await this.db.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!product || product.status !== "PENDING_REVIEW")
      throw new Error("Este produto já foi analisado.");
    const status = approved ? "ACTIVE" : "REJECTED";
    await this.db.product.update({
      where: { id },
      data: {
        status,
        rejectionReason: approved
          ? null
          : reason?.slice(0, 500) || "Não cumpre os requisitos.",
        reviewedAt: new Date(),
        reviewedById: actor.userId,
      },
    });
    await audit.log({
      action: `product.${status.toLowerCase()}`,
      entityType: "Product",
      entityId: id,
      before: { status: product.status },
      after: { status, reason: approved ? null : (reason ?? null) },
      actor,
    });
  }

  async listCatalogAndOperations(actor: Actor) {
    this.authorize(actor);
    const [categories, drivers, settings, auditLogs] = await Promise.all([
      this.db.category.findMany({
        where: realCategoryWhere,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          requiresReview: true,
        },
      }),
      this.db.driver.findMany({
        where: realDriverWhere,
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          availability: true,
          vehicleType: true,
          user: { select: { name: true, phoneNumber: true } },
        },
      }),
      this.db.systemSetting.findMany({
        orderBy: { key: "asc" },
        take: 30,
        select: { key: true, value: true, description: true, updatedAt: true },
      }),
      this.db.auditLog.findMany({
        where: realAuditLogWhere,
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          actorRole: true,
          createdAt: true,
        },
      }),
    ]);
    return { categories, drivers, settings, auditLogs };
  }

  async approveDriver(actor: Actor, id: string) {
    const audit = this.authorize(actor);
    assertCan(actor, "driver:manage");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Entregador inválido.");
    const driver = await this.db.driver.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!driver || driver.status !== "PENDING")
      throw new Error("Entregador não está pendente de aprovação.");
    await this.db.driver.update({
      where: { id },
      data: { status: "ACTIVE", availability: "OFFLINE" },
    });
    await audit.log({
      action: "driver.approved",
      entityType: "Driver",
      entityId: id,
      before: { status: driver.status },
      after: { status: "ACTIVE" },
      actor,
    });
  }

  async createCategory(
    actor: Actor,
    input: { name: string; description?: string },
  ) {
    assertCan(actor, "category:manage");
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80)
      throw new Error("O nome da categoria deve ter entre 2 e 80 caracteres.");
    const slug = name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) throw new Error("Nome de categoria inválido.");
    const category = await this.db.category.create({
      data: {
        name,
        slug,
        description: input.description?.trim().slice(0, 500) || null,
      },
    });
    await new AuditService(this.db).log({
      action: "category.created",
      entityType: "Category",
      entityId: category.id,
      after: { name, slug },
      actor,
    });
    return category;
  }

  async setCategoryActive(actor: Actor, id: string, isActive: boolean) {
    assertCan(actor, "category:manage");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Categoria inválida.");
    const category = await this.db.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, isActive: true },
    });
    if (!category) throw new Error("Categoria não encontrada.");
    await this.db.category.update({ where: { id }, data: { isActive } });
    await new AuditService(this.db).log({
      action: "category.updated",
      entityType: "Category",
      entityId: id,
      before: { isActive: category.isActive },
      after: { isActive },
      actor,
    });
  }
}
