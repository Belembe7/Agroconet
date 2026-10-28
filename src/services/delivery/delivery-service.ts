import { createHash, randomInt } from "node:crypto";
import {
  DeliveryStatus,
  DriverAvailability,
  DriverStatus,
  type PrismaClient,
} from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { assertCan } from "@/lib/permissions";
import { AuditService } from "@/services/audit/audit-service";
import { InventoryService } from "@/services/inventory/inventory-service";

const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  UNASSIGNED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "UNASSIGNED", "CANCELLED"],
  ACCEPTED: ["EN_ROUTE_TO_PICKUP", "UNASSIGNED", "CANCELLED"],
  EN_ROUTE_TO_PICKUP: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["EN_ROUTE_TO_CUSTOMER", "FAILED"],
  EN_ROUTE_TO_CUSTOMER: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["UNASSIGNED", "CANCELLED"],
  CANCELLED: [],
};

export class DeliveryService {
  constructor(private readonly db: PrismaClient) {}

  async driverDashboard(actor: Actor) {
    assertCan(actor, "delivery:update");
    if (!actor.driverId)
      throw new Error("Perfil de entregador não encontrado.");
    const driver = await this.db.driver.findFirst({
      where: { id: actor.driverId, userId: actor.userId, deletedAt: null },
      select: {
        id: true,
        status: true,
        availability: true,
        vehicleType: true,
        plate: true,
        zones: {
          select: { zone: { select: { id: true, name: true, areas: true } } },
        },
      },
    });
    if (!driver || driver.status !== DriverStatus.ACTIVE)
      throw new Error("A conta de entregador ainda não está aprovada.");
    const [deliveries, completed, earnings] = await Promise.all([
      this.db.delivery.findMany({
        where: {
          driverId: driver.id,
          status: {
            notIn: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
          },
        },
        orderBy: [{ status: "asc" }, { assignedAt: "asc" }],
        select: {
          id: true,
          status: true,
          feeCents: true,
          driverFeeCents: true,
          attempts: true,
          pickupAddressSnapshot: true,
          dropoffAddressSnapshot: true,
          sellerOrder: {
            select: {
              order: { select: { number: true, contactPhone: true } },
              seller: {
                select: {
                  businessName: true,
                  phone: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { toStatus: true, note: true, createdAt: true },
          },
        },
      }),
      this.db.delivery.findMany({
        where: { driverId: driver.id, status: DeliveryStatus.DELIVERED },
        orderBy: { deliveredAt: "desc" },
        take: 10,
        select: {
          id: true,
          deliveredAt: true,
          driverFeeCents: true,
          sellerOrder: { select: { order: { select: { number: true } } } },
        },
      }),
      this.db.driverEarning.aggregate({
        where: { driverId: driver.id, status: "PENDING" },
        _sum: { amountCents: true },
        _count: true,
      }),
    ]);
    return {
      driver,
      deliveries,
      completed,
      earnings: earnings._sum.amountCents ?? 0,
      pendingEarningsCount: earnings._count,
    };
  }

  async listDispatch(actor: Actor) {
    assertCan(actor, "delivery:assign");
    const [deliveries, drivers, zones] = await Promise.all([
      this.db.delivery.findMany({
        where: {
          status: { in: ["UNASSIGNED", "FAILED"] },
          sellerOrder: { status: "READY_FOR_PICKUP" },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          status: true,
          attempts: true,
          feeCents: true,
          zoneId: true,
          dropoffAddressSnapshot: true,
          sellerOrder: {
            select: {
              order: { select: { number: true } },
              seller: { select: { businessName: true } },
            },
          },
        },
      }),
      this.db.driver.findMany({
        where: { status: "ACTIVE", availability: "AVAILABLE", deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          vehicleType: true,
          user: { select: { name: true } },
          zones: { select: { zoneId: true } },
        },
      }),
      this.db.deliveryZone.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          province: true,
          areas: true,
          baseFeeCents: true,
        },
      }),
    ]);
    return { deliveries, drivers, zones };
  }

  async assign(actor: Actor, deliveryId: string, driverId: string) {
    assertCan(actor, "delivery:assign");
    if (![deliveryId, driverId].every((id) => /^[0-9a-f-]{36}$/i.test(id)))
      throw new Error("Identificador inválido.");
    const [delivery, driver] = await Promise.all([
      this.db.delivery.findUnique({
        where: { id: deliveryId, sellerOrder: { status: "READY_FOR_PICKUP" } },
        select: { id: true, status: true, zoneId: true, driverId: true },
      }),
      this.db.driver.findFirst({
        where: {
          id: driverId,
          status: "ACTIVE",
          availability: "AVAILABLE",
          deletedAt: null,
        },
        select: { id: true, zones: { select: { zoneId: true } } },
      }),
    ]);
    if (!delivery || !["UNASSIGNED", "FAILED"].includes(delivery.status))
      throw new Error("Entrega indisponível para atribuição.");
    if (!driver) throw new Error("Entregador indisponível.");
    if (
      delivery.zoneId &&
      !driver.zones.some((z) => z.zoneId === delivery.zoneId)
    )
      throw new Error("O entregador não está registado nesta zona.");
    await this.db.$transaction(async (tx) => {
      const current = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          driverId,
          status: "ASSIGNED",
          assignedAt: new Date(),
          failedReason: null,
        },
        select: { status: true },
      });
      await tx.driver.update({
        where: { id: driverId },
        data: { availability: "BUSY" },
      });
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: delivery.status,
          toStatus: current.status,
          actorUserId: actor.userId,
          note: "Atribuição manual pelo painel.",
        },
      });
      await new AuditService(tx as unknown as PrismaClient).log({
        action: "delivery.assigned",
        entityType: "Delivery",
        entityId: deliveryId,
        before: { driverId: delivery.driverId, status: delivery.status },
        after: { driverId, status: current.status },
        actor,
      });
    });
  }

  async transition(
    actor: Actor,
    deliveryId: string,
    next: DeliveryStatus,
    input: { code?: string; note?: string } = {},
  ) {
    assertCan(actor, "delivery:update");
    if (!actor.driverId || !/^[0-9a-f-]{36}$/i.test(deliveryId))
      throw new Error("Entregador ou entrega inválidos.");
    const delivery = await this.db.delivery.findFirst({
      where: { id: deliveryId, driverId: actor.driverId },
      select: {
        id: true,
        status: true,
        confirmationCodeHash: true,
        driverId: true,
        sellerOrder: {
          select: {
            id: true,
            orderId: true,
            items: { select: { variantId: true, quantity: true } },
          },
        },
      },
    });
    if (!delivery) throw new Error("Esta entrega não pertence à sua conta.");
    if (!transitions[delivery.status].includes(next))
      throw new Error("Transição de estado inválida.");
    if (next === "DELIVERED") {
      if (
        !input.code ||
        !delivery.confirmationCodeHash ||
        createHash("sha256").update(input.code.trim()).digest("hex") !==
          delivery.confirmationCodeHash
      )
        throw new Error("Código de confirmação inválido.");
    }
    if (next === "FAILED" && !input.note?.trim())
      throw new Error("Indique o motivo da falha.");
    await this.db.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: next,
          driverId: next === "UNASSIGNED" ? null : undefined,
          acceptedAt: next === "ACCEPTED" ? new Date() : undefined,
          pickedUpAt: next === "PICKED_UP" ? new Date() : undefined,
          deliveredAt: next === "DELIVERED" ? new Date() : undefined,
          attempts: next === "FAILED" ? { increment: 1 } : undefined,
          failedReason:
            next === "FAILED" ? input.note!.trim().slice(0, 500) : null,
        },
      });
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: delivery.status,
          toStatus: next,
          actorUserId: actor.userId,
          note: input.note?.trim().slice(0, 500),
        },
      });
      if (next === "DELIVERED") {
        const orderItems = delivery.sellerOrder.items;
        const reservations = await tx.stockReservation.findMany({
          where: {
            orderId: delivery.sellerOrder.orderId,
            variantId: { in: orderItems.map((item) => item.variantId) },
            status: "ACTIVE",
          },
          select: { id: true, variantId: true, quantity: true },
        });
        for (const item of orderItems) {
          const reservation = reservations.find(
            (row) => row.variantId === item.variantId,
          );
          if (!reservation || reservation.quantity !== item.quantity) {
            throw new Error(
              "A reserva de stock deste pedido está inconsistente.",
            );
          }
          await new InventoryService(this.db).consumeReservationInTransaction(
            tx,
            reservation.id,
          );
        }
        await tx.sellerOrder.update({
          where: { id: delivery.sellerOrder.id },
          data: { status: "DELIVERED" },
        });
        const [undelivered, delivered] = await Promise.all([
          tx.sellerOrder.count({
            where: {
              orderId: delivery.sellerOrder.orderId,
              id: { not: delivery.sellerOrder.id },
              status: { notIn: ["DELIVERED", "CANCELLED", "REJECTED"] },
            },
          }),
          tx.sellerOrder.count({
            where: {
              orderId: delivery.sellerOrder.orderId,
              status: "DELIVERED",
            },
          }),
        ]);
        await tx.order.update({
          where: { id: delivery.sellerOrder.orderId },
          data: {
            status:
              undelivered === 0
                ? "DELIVERED"
                : delivered > 0
                  ? "PARTIALLY_DELIVERED"
                  : undefined,
          },
        });
        await tx.driver.update({
          where: { id: actor.driverId! },
          data: { availability: DriverAvailability.AVAILABLE },
        });
        await tx.driverEarning.upsert({
          where: { deliveryId },
          create: {
            driverId: actor.driverId!,
            deliveryId,
            amountCents: (
              await tx.delivery.findUniqueOrThrow({
                where: { id: deliveryId },
                select: { driverFeeCents: true },
              })
            ).driverFeeCents,
          },
          update: {},
        });
      }
      if (next === "FAILED" || next === "UNASSIGNED")
        await tx.driver.update({
          where: { id: actor.driverId! },
          data: { availability: DriverAvailability.AVAILABLE },
        });
      await new AuditService(tx as unknown as PrismaClient).log({
        action: `delivery.${next.toLowerCase()}`,
        entityType: "Delivery",
        entityId: deliveryId,
        before: { status: delivery.status },
        after: { status: next, note: input.note ?? null },
        actor,
      });
    });
  }

  async toggleAvailability(actor: Actor, available: boolean) {
    assertCan(actor, "delivery:update");
    if (!actor.driverId)
      throw new Error("Perfil de entregador não encontrado.");
    const result = await this.db.driver.updateMany({
      where: {
        id: actor.driverId,
        userId: actor.userId,
        status: "ACTIVE",
        deletedAt: null,
        ...(available ? {} : { availability: { not: "BUSY" } }),
      },
      data: { availability: available ? "AVAILABLE" : "OFFLINE" },
    });
    if (!result.count)
      throw new Error("Não é possível alterar a disponibilidade desta conta.");
  }

  async createConfirmationCode(actor: Actor, deliveryId: string) {
    assertCan(actor, "delivery:assign");
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.db.delivery.update({
      where: { id: deliveryId },
      data: {
        confirmationCodeHash: createHash("sha256").update(code).digest("hex"),
        confirmationMethod: "CODE",
      },
    });
    return code;
  }

  async createZone(
    actor: Actor,
    input: {
      name: string;
      province: string;
      areas: string[];
      baseFeeCents: number;
    },
  ) {
    assertCan(actor, "driver:manage");
    if (
      input.name.length < 2 ||
      input.province.length < 2 ||
      input.areas.length === 0 ||
      !Number.isSafeInteger(input.baseFeeCents) ||
      input.baseFeeCents < 0
    )
      throw new Error("Dados de zona inválidos.");
    return this.db.deliveryZone.create({
      data: {
        name: input.name.trim(),
        province: input.province.trim(),
        areas: input.areas.map((area) => area.trim()).filter(Boolean),
        baseFeeCents: input.baseFeeCents,
      },
    });
  }
}
