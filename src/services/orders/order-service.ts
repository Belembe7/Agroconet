import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { CartSnapshot } from "@/services/cart/cart-service";

type Db = PrismaClient | Prisma.TransactionClient;
export class OrderService {
  constructor(private readonly db: Db) {}

  async place(input: {
    userId: string;
    cart: CartSnapshot;
    addressId: string;
    paymentMethod: "COD";
    idempotencyKey: string;
  }) {
    if (!input.cart.itemCount) throw new Error("O carrinho está vazio.");
    const root = this.db as PrismaClient;
    if (typeof root.$transaction !== "function")
      throw new Error("A criação de pedidos requer uma transação.");
    const prior = await root.order.findFirst({
      where: { userId: input.userId, idempotencyKey: input.idempotencyKey },
    });
    if (prior) return prior;
    try {
      return await root.$transaction(
        async (tx) => {
          const address = await tx.address.findFirst({
            where: {
              id: input.addressId,
              userId: input.userId,
              deletedAt: null,
            },
          });
          if (!address) throw new Error("Escolha uma morada válida.");
          const groups = input.cart.groups;
          for (const line of groups.flatMap((group) => group.items)) {
            const stock = await tx.inventory.findUnique({
              where: { variantId: line.variantId },
            });
            if (
              !stock ||
              stock.quantityOnHand - stock.quantityReserved < line.quantity
            )
              throw new Error(`Stock insuficiente para ${line.productName}.`);
            await tx.inventory.update({
              where: { variantId: line.variantId },
              data: { quantityReserved: { increment: line.quantity } },
            });
          }
          const subtotalCents = input.cart.totalCents;
          const number = `AG-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
          const addressSnapshot = {
            label: address.label,
            recipientName: address.recipientName,
            phone: address.phone,
            province: address.province,
            district: address.district,
            neighborhood: address.neighborhood,
            street: address.street,
            reference: address.reference,
            latitude: address.latitude?.toString() ?? null,
            longitude: address.longitude?.toString() ?? null,
          };
          const order = await tx.order.create({
            data: {
              number,
              userId: input.userId,
              subtotalCents,
              deliveryTotalCents: 0,
              totalCents: subtotalCents,
              shippingAddressSnapshot: addressSnapshot,
              contactPhone: address.phone,
              idempotencyKey: input.idempotencyKey,
              placedAt: new Date(),
              statusHistory: {
                create: {
                  toStatus: "PENDING",
                  actorUserId: input.userId,
                  note: "Pedido submetido pelo checkout.",
                },
              },
              payments: {
                create: {
                  provider: "COD",
                  method: input.paymentMethod,
                  status: "PENDING_COLLECTION",
                  amountCents: subtotalCents,
                  idempotencyKey: randomBytes(24).toString("hex"),
                },
              },
            },
          });
          for (const line of groups.flatMap((group) => group.items))
            await tx.stockReservation.create({
              data: {
                variantId: line.variantId,
                orderId: order.id,
                quantity: line.quantity,
                status: "ACTIVE",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          for (const group of groups) {
            const seller = await tx.seller.findUnique({
              where: { id: group.sellerId },
              select: {
                commissionBpsOverride: true,
                businessName: true,
                phone: true,
                addressText: true,
                latitude: true,
                longitude: true,
                province: true,
                district: true,
              },
            });
            const commissionBps = seller?.commissionBpsOverride ?? 0;
            const commissionCents = Math.round(
              (group.subtotalCents * commissionBps) / 10_000,
            );
            await tx.sellerOrder.create({
              data: {
                orderId: order.id,
                sellerId: group.sellerId,
                subtotalCents: group.subtotalCents,
                deliveryFeeCents: 0,
                commissionCents,
                sellerNetCents: group.subtotalCents - commissionCents,
                delivery: {
                  create: {
                    pickupAddressSnapshot: {
                      businessName: seller?.businessName ?? "",
                      phone: seller?.phone ?? "",
                      reference: seller?.addressText ?? "",
                      province: seller?.province ?? "",
                      district: seller?.district ?? "",
                      latitude: seller?.latitude?.toString() ?? null,
                      longitude: seller?.longitude?.toString() ?? null,
                    },
                    dropoffAddressSnapshot: addressSnapshot,
                    zoneId: address.zoneId,
                    feeCents: 0,
                    driverFeeCents: 0,
                  },
                },
                items: {
                  create: group.items.map((item) => ({
                    variantId: item.variantId,
                    productName: item.productName,
                    variantLabel: item.variantLabel,
                    sku: item.variantId,
                    unitPriceCents: item.priceCents,
                    quantity: item.quantity,
                    lineTotalCents: item.lineTotalCents,
                    commissionBps,
                    commissionCents: Math.round(
                      (item.lineTotalCents * commissionBps) / 10_000,
                    ),
                  })),
                },
              },
            });
          }
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const duplicate = await root.order.findFirst({
          where: { userId: input.userId, idempotencyKey: input.idempotencyKey },
        });
        if (duplicate) return duplicate;
      }
      throw error;
    }
  }
}
