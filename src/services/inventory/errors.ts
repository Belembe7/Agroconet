export class InventoryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class InsufficientStockError extends InventoryError {
  readonly variantId: string;
  readonly requested: number;
  readonly available: number;

  constructor(variantId: string, requested: number, available: number) {
    super(
      "INSUFFICIENT_STOCK",
      `Insufficient stock for variant ${variantId}: requested ${requested}, available ${available}`,
    );
    this.variantId = variantId;
    this.requested = requested;
    this.available = available;
  }
}

export class InvalidQuantityError extends InventoryError {
  constructor(message = "Quantity must be a positive integer") {
    super("INVALID_QUANTITY", message);
  }
}

export class ReservationNotFoundError extends InventoryError {
  readonly reservationId: string;

  constructor(reservationId: string) {
    super(
      "RESERVATION_NOT_FOUND",
      `Stock reservation ${reservationId} was not found`,
    );
    this.reservationId = reservationId;
  }
}

export class ReservationNotActiveError extends InventoryError {
  readonly reservationId: string;
  readonly status: string;

  constructor(reservationId: string, status: string) {
    super(
      "RESERVATION_NOT_ACTIVE",
      `Stock reservation ${reservationId} is ${status}, expected ACTIVE`,
    );
    this.reservationId = reservationId;
    this.status = status;
  }
}
