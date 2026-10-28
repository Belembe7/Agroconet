import { z } from "zod";
import { createHash, randomInt } from "node:crypto";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { CustomerApiError } from "@/lib/customer-api-error";
import {
  editableDeliveryStates,
  hasActiveRoute,
  pointFromSnapshot,
  type DeliveryMapItem,
} from "@/features/delivery/route-types";

export const mapPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export function deliveryMapScope(actor: Actor): Prisma.DeliveryWhereInput {
  if (actor.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN"))
    return {};
  return {
    OR: [
      { sellerOrder: { order: { userId: actor.userId } } },
      ...(actor.driverId ? [{ driverId: actor.driverId }] : []),
      ...(actor.sellerId
        ? [{ sellerOrder: { sellerId: actor.sellerId } }]
        : []),
    ],
  };
}
export class DeliveryMapService {
  constructor(private db: PrismaClient) {}
  async list(actor: Actor): Promise<DeliveryMapItem[]> {
    const rows = await this.db.delivery.findMany({
      where: deliveryMapScope(actor),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sellerOrder: {
          include: {
            order: { select: { number: true, userId: true } },
            seller: {
              select: { businessName: true, latitude: true, longitude: true },
            },
          },
        },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      number: row.sellerOrder.order.number,
      seller: row.sellerOrder.seller.businessName,
      status: row.status,
      routeActive: hasActiveRoute(row.status),
      canEdit:
        row.sellerOrder.order.userId === actor.userId &&
        editableDeliveryStates.includes(row.status),
      canConfirm:
        row.sellerOrder.order.userId === actor.userId &&
        hasActiveRoute(row.status),
      canEditOrigin:
        (actor.roles.some(
          (role) => role === "ADMIN" || role === "SUPER_ADMIN",
        ) ||
          actor.sellerId === row.sellerOrder.sellerId) &&
        editableDeliveryStates.includes(row.status),
      origin:
        pointFromSnapshot(row.pickupAddressSnapshot) ??
        pointFromSnapshot({
          latitude: row.sellerOrder.seller.latitude?.toString(),
          longitude: row.sellerOrder.seller.longitude?.toString(),
        }),
      destination: pointFromSnapshot(row.dropoffAddressSnapshot),
    }));
  }
  async get(actor: Actor, id: string) {
    z.string().uuid().parse(id);
    const record = await this.db.delivery.findFirst({
      where: { AND: [{ id }, deliveryMapScope(actor)] },
      include: { sellerOrder: { include: { seller: true } } },
    });
    if (!record) throw new CustomerApiError("Entrega não encontrada.", 404);
    return record;
  }
  async saveDestination(actor: Actor, input: unknown) {
    const value = mapPointSchema
      .extend({ deliveryId: z.string().uuid() })
      .parse(input);
    const row = await this.db.delivery.findFirst({
      where: {
        id: value.deliveryId,
        sellerOrder: { order: { userId: actor.userId } },
      },
    });
    if (!row) throw new CustomerApiError("Entrega não encontrada.", 404);
    if (!editableDeliveryStates.includes(row.status))
      throw new CustomerApiError(
        "O destino já não pode ser alterado nesta fase da entrega.",
        409,
      );
    const previous =
      row.dropoffAddressSnapshot &&
      typeof row.dropoffAddressSnapshot === "object" &&
      !Array.isArray(row.dropoffAddressSnapshot)
        ? row.dropoffAddressSnapshot
        : {};
    return this.db.$transaction(async (tx) => {
      const result = await tx.delivery.updateMany({
        where: {
          id: row.id,
          status: {
            in: ["UNASSIGNED", "ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_PICKUP"],
          },
        },
        data: {
          dropoffAddressSnapshot: {
            ...previous,
            latitude: value.latitude,
            longitude: value.longitude,
          },
        },
      });
      if (!result.count)
        throw new CustomerApiError(
          "A entrega mudou de estado. Actualize a página.",
          409,
        );
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: row.id,
          fromStatus: row.status,
          toStatus: row.status,
          actorUserId: actor.userId,
          note: "Cliente actualizou a localização de entrega no mapa.",
        },
      });
      if (row.driverId) {
        const driver = await tx.driver.findUnique({
          where: { id: row.driverId },
          select: { userId: true },
        });
        if (driver)
          await tx.notification.create({
            data: {
              userId: driver.userId,
              type: "delivery.destination",
              title: "Destino actualizado",
              body: "O cliente actualizou a localização da entrega.",
              data: { deliveryId: row.id, href: "/entrega" },
            },
          });
      }
      return { saved: true };
    });
  }
  async confirmationCode(actor: Actor, id: string) {
    z.string().uuid().parse(id);
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const result = await this.db.delivery.updateMany({
      where: {
        id,
        status: { notIn: ["DELIVERED", "CANCELLED", "FAILED"] },
        sellerOrder: { order: { userId: actor.userId } },
      },
      data: {
        confirmationCodeHash: createHash("sha256").update(code).digest("hex"),
        confirmationMethod: "CODE",
      },
    });
    if (!result.count)
      throw new CustomerApiError("Entrega activa não encontrada.", 404);
    return { code };
  }
  async saveOrigin(actor: Actor, input: unknown) {
    const value = mapPointSchema
      .extend({ deliveryId: z.string().uuid() })
      .parse(input);
    const row = await this.get(actor, value.deliveryId);
    if (
      !actor.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN") &&
      actor.sellerId !== row.sellerOrder.sellerId
    )
      throw new CustomerApiError(
        "Apenas o vendedor ou a administração pode marcar a partida.",
        403,
      );
    const previous =
      row.pickupAddressSnapshot &&
      typeof row.pickupAddressSnapshot === "object" &&
      !Array.isArray(row.pickupAddressSnapshot)
        ? row.pickupAddressSnapshot
        : {};
    return this.db.$transaction(async (tx) => {
      const updated = await tx.delivery.updateMany({
        where: {
          id: row.id,
          status: {
            in: ["UNASSIGNED", "ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_PICKUP"],
          },
        },
        data: {
          pickupAddressSnapshot: {
            ...previous,
            latitude: value.latitude,
            longitude: value.longitude,
          },
        },
      });
      if (!updated.count)
        throw new CustomerApiError(
          "A partida já não pode ser alterada nesta fase.",
          409,
        );
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: row.id,
          fromStatus: row.status,
          toStatus: row.status,
          actorUserId: actor.userId,
          note: "Localização de recolha marcada no mapa.",
        },
      });
      return { saved: true };
    });
  }
}
