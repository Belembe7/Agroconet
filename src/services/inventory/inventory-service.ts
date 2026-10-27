import {
  InventoryMovementType,
  Prisma,
  PrismaClient,
  StockReservationStatus,
  type Inventory,
  type InventoryMovement,
  type StockReservation,
} from "@/generated/prisma/client";
import {
  InsufficientStockError,
  InvalidQuantityError,
  ReservationNotActiveError,
  ReservationNotFoundError,
} from "@/services/inventory/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type MoveInput = {
  variantId: string;
  type: InventoryMovementType;
  /** Positive magnitude for directional types; signed for ADJUSTMENT. */
  quantity: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  actorUserId?: string;
};

export type ReserveInput = {
  variantId: string;
  quantity: number;
  orderId?: string;
  checkoutSessionId?: string;
  expiresAt: Date;
};

const POSITIVE_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.IN,
  InventoryMovementType.RETURN,
  InventoryMovementType.CANCELLED_ORDER,
]);

const NEGATIVE_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.OUT,
  InventoryMovementType.SALE,
]);

function assertPositiveInt(quantity: number, label = "quantity"): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidQuantityError(`${label} must be a positive integer`);
  }
}

function signedQuantityForType(
  type: InventoryMovementType,
  quantity: number,
): number {
  if (type === InventoryMovementType.ADJUSTMENT) {
    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new InvalidQuantityError(
        "ADJUSTMENT quantity must be a non-zero integer",
      );
    }
    return quantity;
  }

  assertPositiveInt(quantity);

  if (POSITIVE_TYPES.has(type)) return quantity;
  if (NEGATIVE_TYPES.has(type)) return -quantity;

  throw new InvalidQuantityError(`Unsupported movement type: ${type}`);
}

export class InventoryService {
  constructor(private readonly db: PrismaClient) {}

  async ensureInventory(
    variantId: string,
    client: DbClient = this.db,
  ): Promise<Inventory> {
    return client.inventory.upsert({
      where: { variantId },
      create: {
        variantId,
        quantityOnHand: 0,
        quantityReserved: 0,
      },
      update: {},
    });
  }

  async available(variantId: string): Promise<number> {
    const row = await this.db.inventory.findUnique({
      where: { variantId },
      select: { quantityOnHand: true, quantityReserved: true },
    });
    if (!row) return 0;
    return row.quantityOnHand - row.quantityReserved;
  }

  async move(input: MoveInput): Promise<InventoryMovement> {
    const signedQty = signedQuantityForType(input.type, input.quantity);

    return this.db.$transaction(async (tx) => {
      await this.ensureInventory(input.variantId, tx);

      const updated = await tx.$queryRaw<
        Array<{ quantity_on_hand: number; quantity_reserved: number }>
      >`
        UPDATE inventories
        SET
          quantity_on_hand = quantity_on_hand + ${signedQty},
          updated_at = NOW()
        WHERE variant_id = ${input.variantId}::uuid
          AND quantity_on_hand + ${signedQty} >= 0
          AND quantity_on_hand + ${signedQty} >= quantity_reserved
        RETURNING quantity_on_hand, quantity_reserved
      `;

      if (updated.length === 0) {
        const current = await this.availableInTx(tx, input.variantId);
        throw new InsufficientStockError(
          input.variantId,
          Math.abs(signedQty),
          current,
        );
      }

      const balanceAfter = updated[0]!.quantity_on_hand;

      return tx.inventoryMovement.create({
        data: {
          variantId: input.variantId,
          type: input.type,
          quantity: signedQty,
          balanceAfter,
          reason: input.reason,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          actorUserId: input.actorUserId,
        },
      });
    });
  }

  async reserve(input: ReserveInput): Promise<StockReservation> {
    assertPositiveInt(input.quantity);

    if (!input.orderId && !input.checkoutSessionId) {
      throw new InvalidQuantityError(
        "reserve requires orderId or checkoutSessionId",
      );
    }

    return this.db.$transaction(async (tx) => {
      await this.ensureInventory(input.variantId, tx);

      const affected = await tx.$executeRaw`
        UPDATE inventories
        SET
          quantity_reserved = quantity_reserved + ${input.quantity},
          updated_at = NOW()
        WHERE variant_id = ${input.variantId}::uuid
          AND quantity_on_hand - quantity_reserved >= ${input.quantity}
      `;

      if (affected === 0) {
        const current = await this.availableInTx(tx, input.variantId);
        throw new InsufficientStockError(
          input.variantId,
          input.quantity,
          current,
        );
      }

      return tx.stockReservation.create({
        data: {
          variantId: input.variantId,
          quantity: input.quantity,
          orderId: input.orderId,
          checkoutSessionId: input.checkoutSessionId,
          expiresAt: input.expiresAt,
          status: StockReservationStatus.ACTIVE,
        },
      });
    });
  }

  async releaseReservation(reservationId: string): Promise<StockReservation> {
    return this.db.$transaction((tx) =>
      this.releaseReservationInTransaction(tx, reservationId),
    );
  }

  async releaseReservationInTransaction(
    tx: Prisma.TransactionClient,
    reservationId: string,
  ): Promise<StockReservation> {
    const reservation = await tx.stockReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }
    if (reservation.status !== StockReservationStatus.ACTIVE) {
      throw new ReservationNotActiveError(reservationId, reservation.status);
    }

    const affected = await tx.$executeRaw`
        UPDATE inventories
        SET
          quantity_reserved = quantity_reserved - ${reservation.quantity},
          updated_at = NOW()
        WHERE variant_id = ${reservation.variantId}::uuid
          AND quantity_reserved >= ${reservation.quantity}
      `;

    if (affected === 0) {
      throw new InsufficientStockError(
        reservation.variantId,
        reservation.quantity,
        0,
      );
    }

    return tx.stockReservation.update({
      where: { id: reservationId },
      data: { status: StockReservationStatus.RELEASED },
    });
  }

  async consumeReservation(reservationId: string): Promise<{
    reservation: StockReservation;
    movement: InventoryMovement;
  }> {
    return this.db.$transaction((tx) =>
      this.consumeReservationInTransaction(tx, reservationId),
    );
  }

  async consumeReservationInTransaction(
    tx: Prisma.TransactionClient,
    reservationId: string,
  ): Promise<{ reservation: StockReservation; movement: InventoryMovement }> {
    const reservation = await tx.stockReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }
    if (reservation.status !== StockReservationStatus.ACTIVE) {
      throw new ReservationNotActiveError(reservationId, reservation.status);
    }

    const updated = await tx.$queryRaw<Array<{ quantity_on_hand: number }>>`
        UPDATE inventories
        SET
          quantity_on_hand = quantity_on_hand - ${reservation.quantity},
          quantity_reserved = quantity_reserved - ${reservation.quantity},
          updated_at = NOW()
        WHERE variant_id = ${reservation.variantId}::uuid
          AND quantity_reserved >= ${reservation.quantity}
          AND quantity_on_hand >= ${reservation.quantity}
        RETURNING quantity_on_hand
      `;

    if (updated.length === 0) {
      throw new InsufficientStockError(
        reservation.variantId,
        reservation.quantity,
        0,
      );
    }

    const balanceAfter = updated[0]!.quantity_on_hand;

    const [reservationUpdated, movement] = await Promise.all([
      tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: StockReservationStatus.CONSUMED },
      }),
      tx.inventoryMovement.create({
        data: {
          variantId: reservation.variantId,
          type: InventoryMovementType.SALE,
          quantity: -reservation.quantity,
          balanceAfter,
          reason: "consume_reservation",
          referenceType: reservation.orderId ? "ORDER" : "CHECKOUT_SESSION",
          referenceId: reservation.orderId ?? reservation.checkoutSessionId,
        },
      }),
    ]);

    return { reservation: reservationUpdated, movement };
  }

  /** Release expired checkout stock and cancel untouched COD orders. Run on a scheduled worker. */
  async expireDueReservations(options?: {
    now?: Date;
    limit?: number;
  }): Promise<number> {
    const now = options?.now ?? new Date();
    const limit = options?.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new InvalidQuantityError(
        "expiration batch limit must be between 1 and 1000",
      );
    }

    return this.db.$transaction(
      async (tx) => {
        const due = await tx.stockReservation.findMany({
          where: {
            status: StockReservationStatus.ACTIVE,
            expiresAt: { lte: now },
            OR: [
              { orderId: null },
              {
                order: {
                  is: {
                    status: "PENDING",
                    sellerOrders: { every: { status: "PENDING" } },
                  },
                },
              },
            ],
          },
          orderBy: { expiresAt: "asc" },
          take: limit,
          select: { id: true, orderId: true, variantId: true, quantity: true },
        });

        let released = 0;
        for (const reservation of due.filter((item) => item.orderId === null)) {
          const claimed = await tx.stockReservation.updateMany({
            where: {
              id: reservation.id,
              status: StockReservationStatus.ACTIVE,
              orderId: null,
              expiresAt: { lte: now },
            },
            data: { status: StockReservationStatus.EXPIRED },
          });
          if (!claimed.count) continue;

          const affected = await tx.$executeRaw`
          UPDATE inventories
          SET quantity_reserved = quantity_reserved - ${reservation.quantity}, updated_at = NOW()
          WHERE variant_id = ${reservation.variantId}::uuid
            AND quantity_reserved >= ${reservation.quantity}
        `;
          if (affected !== 1) {
            throw new InsufficientStockError(
              reservation.variantId,
              reservation.quantity,
              0,
            );
          }
          released += 1;
        }

        const orderIds = [
          ...new Set(due.flatMap((item) => item.orderId ?? [])),
        ];
        for (const orderId of orderIds) {
          const untouchedOrder = await tx.order.findFirst({
            where: {
              id: orderId,
              status: "PENDING",
              sellerOrders: { every: { status: "PENDING" } },
            },
            select: { id: true },
          });
          if (!untouchedOrder) continue;

          const reservations = await tx.stockReservation.findMany({
            where: {
              orderId,
              status: StockReservationStatus.ACTIVE,
              expiresAt: { lte: now },
            },
            select: { id: true, variantId: true, quantity: true },
          });
          if (!reservations.length) continue;

          const claimed = await tx.stockReservation.updateMany({
            where: {
              orderId,
              status: StockReservationStatus.ACTIVE,
              expiresAt: { lte: now },
            },
            data: { status: StockReservationStatus.EXPIRED },
          });
          if (!claimed.count) continue;

          const quantities = new Map<string, number>();
          for (const reservation of reservations) {
            quantities.set(
              reservation.variantId,
              (quantities.get(reservation.variantId) ?? 0) +
                reservation.quantity,
            );
          }
          for (const [variantId, quantity] of quantities) {
            const affected = await tx.$executeRaw`
              UPDATE inventories
              SET quantity_reserved = quantity_reserved - ${quantity}, updated_at = NOW()
              WHERE variant_id = ${variantId}::uuid
                AND quantity_reserved >= ${quantity}
            `;
            if (affected !== 1) {
              throw new InsufficientStockError(variantId, quantity, 0);
            }
          }

          await tx.sellerOrder.updateMany({
            where: { orderId, status: "PENDING" },
            data: {
              status: "CANCELLED",
              rejectionReason: "Pedido expirado por falta de confirmação.",
            },
          });
          const cancelled = await tx.order.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: {
              status: "CANCELLED",
              cancelledAt: now,
              cancelReason: "Pedido expirado após 24 horas sem confirmação.",
            },
          });
          if (cancelled.count) {
            await tx.orderStatusHistory.create({
              data: {
                orderId,
                fromStatus: "PENDING",
                toStatus: "CANCELLED",
                note: "Reserva de stock expirada antes da confirmação do vendedor.",
              },
            });
          }
          released += claimed.count;
        }
        return released;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async availableInTx(
    tx: Prisma.TransactionClient,
    variantId: string,
  ): Promise<number> {
    const row = await tx.inventory.findUnique({
      where: { variantId },
      select: { quantityOnHand: true, quantityReserved: true },
    });
    if (!row) return 0;
    return row.quantityOnHand - row.quantityReserved;
  }
}
