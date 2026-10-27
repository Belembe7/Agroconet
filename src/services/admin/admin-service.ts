import type { PrismaClient } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { assertCan } from "@/lib/permissions";
import { AuditService } from "@/services/audit/audit-service";

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
      this.db.order.count(),
      this.db.seller.count({ where: { deletedAt: null } }),
      this.db.product.count({ where: { deletedAt: null } }),
      this.db.driver.count({ where: { deletedAt: null } }),
      this.db.delivery.count(),
      this.db.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amountCents: true },
      }),
      this.db.order.findMany({
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
        where: { status: "PENDING", deletedAt: null },
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
        where: { status: "PENDING_REVIEW", deletedAt: null },
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
        where: { deletedAt: null },
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
        where: { deletedAt: null },
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
