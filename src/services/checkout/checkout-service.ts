import type { PrismaClient } from "@/generated/prisma/client";
export class CheckoutService {
  constructor(private readonly db: PrismaClient) {}
  async addresses(userId: string) {
    return this.db.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }
  async orders(userId: string) {
    return this.db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sellerOrders: {
          include: { items: true, seller: { select: { businessName: true } } },
        },
        payments: { select: { method: true, status: true } },
      },
    });
  }
}
