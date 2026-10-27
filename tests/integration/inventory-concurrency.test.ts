import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  InventoryMovementType,
  PrismaClient,
  ProductUnit,
  SellerStatus,
} from "@/generated/prisma/client";
import { InsufficientStockError } from "@/services/inventory/errors";
import { InventoryService } from "@/services/inventory/inventory-service";

describe("InventoryService concurrency", () => {
  let prisma: PrismaClient;
  let inventory: InventoryService;
  let variantId: string;
  let checkoutSessionId: string;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is required for integration tests");
    }

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url }),
    });
    inventory = new InventoryService(prisma);

    const fixture = await seedFixture(prisma);
    variantId = fixture.variantId;
    checkoutSessionId = fixture.checkoutSessionId;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.stockReservation.deleteMany({ where: { variantId } });
    await prisma.inventoryMovement.deleteMany({ where: { variantId } });
    await prisma.inventory.update({
      where: { variantId },
      data: { quantityOnHand: 1, quantityReserved: 0 },
    });
  });

  it("allows only one of many concurrent reserves when stock is 1", async () => {
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    const attempts = 20;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        inventory.reserve({
          variantId,
          quantity: 1,
          checkoutSessionId,
          expiresAt,
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(attempts - 1);

    for (const result of rejected) {
      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(InsufficientStockError);
      }
    }

    const row = await prisma.inventory.findUniqueOrThrow({
      where: { variantId },
    });
    expect(row.quantityOnHand).toBe(1);
    expect(row.quantityReserved).toBe(1);
    expect(await inventory.available(variantId)).toBe(0);

    const active = await prisma.stockReservation.count({
      where: { variantId, status: "ACTIVE" },
    });
    expect(active).toBe(1);
  });

  it("move SALE cannot consume units held by a reservation", async () => {
    await inventory.reserve({
      variantId,
      quantity: 1,
      checkoutSessionId,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    });

    await expect(
      inventory.move({
        variantId,
        type: InventoryMovementType.SALE,
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    expect(await inventory.available(variantId)).toBe(0);
  });
});

async function seedFixture(prisma: PrismaClient) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.user.create({
    data: {
      phoneNumber: `+25884${suffix.replace(/\D/g, "").slice(-7).padStart(7, "0")}`,
      email: `inv-test-${suffix}@dev.agroconet.local`,
      name: `[DEV] Inventory Test ${suffix}`,
    },
  });

  const category = await prisma.category.create({
    data: {
      name: `[DEV] Inv Cat ${suffix}`,
      slug: `dev-inv-cat-${suffix}`,
    },
  });

  const seller = await prisma.seller.create({
    data: {
      userId: user.id,
      businessName: `[DEV] Inv Seller ${suffix}`,
      phone: user.phoneNumber!,
      province: "Maputo",
      district: "KaMpfumo",
      addressText: "Test",
      slug: `dev-inv-seller-${suffix}`,
      status: SellerStatus.APPROVED,
    },
  });

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      categoryId: category.id,
      name: `[DEV] Inv Product ${suffix}`,
      slug: `dev-inv-product-${suffix}`,
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: `DEV-INV-${suffix}`,
      label: "Unit",
      unit: ProductUnit.UNIT,
      unitSize: 1,
      priceCents: 1000,
      isDefault: true,
    },
  });

  await prisma.inventory.create({
    data: {
      variantId: variant.id,
      quantityOnHand: 1,
      quantityReserved: 0,
    },
  });

  const checkoutSession = await prisma.checkoutSession.create({
    data: {
      userId: user.id,
      cartSnapshot: {},
      step: "review",
      expiresAt: new Date(Date.now() + 60 * 60_000),
    },
  });

  return {
    variantId: variant.id,
    checkoutSessionId: checkoutSession.id,
  };
}
