import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { LandingService } from "@/services/catalog/landing-service";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
afterAll(() => db.$disconnect());

// Every fixture lives inside a rolled-back transaction, including failed assertions.
async function withFixture(
  run: (
    tx: Prisma.TransactionClient,
    fixture: {
      categoryId: string;
      categorySlug: string;
      sellerId: string;
      productId: string;
      variantId: string;
    },
  ) => Promise<void>,
) {
  const rollback = new Error("ROLLBACK_LANDING_TEST");
  try {
    await db.$transaction(
      async (tx) => {
        const suffix = randomUUID();
        const user = await tx.user.create({
          data: {
            name: "Landing test",
            email: `${suffix}@test.local`,
            phoneNumber: `+258${suffix
              .replace(/[^0-9]/g, "")
              .padEnd(9, "0")
              .slice(0, 9)}`,
          },
        });
        const seller = await tx.seller.create({
          data: {
            userId: user.id,
            businessName: "Landing seller",
            phone: user.phoneNumber!,
            province: "Maputo",
            district: "Maputo",
            addressText: "Test",
            slug: `test-${suffix}`,
            status: "APPROVED",
          },
        });
        const category = await tx.category.create({
          data: {
            name: "Landing test",
            slug: `landing-${suffix}`,
            sortOrder: -1000,
          },
        });
        const product = await tx.product.create({
          data: {
            name: "Milho de teste",
            brand: suffix,
            slug: suffix,
            sellerId: seller.id,
            categoryId: category.id,
            status: "ACTIVE",
          },
        });
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: suffix,
            label: "1 kg",
            unit: "KG",
            unitSize: 1,
            priceCents: 15000,
            inventory: { create: { quantityOnHand: 2, quantityReserved: 2 } },
          },
        });
        await run(tx, {
          categoryId: category.id,
          categorySlug: category.slug,
          sellerId: seller.id,
          productId: product.id,
          variantId: variant.id,
        });
        throw rollback;
      },
      { timeout: 60000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
}
describe("LandingService visibilidade pública", () => {
  it("oculta rascunhos, produtos apagados, vendedores suspensos e categorias inactivas", async () => {
    await withFixture(async (tx, f) => {
      const service = new LandingService(tx);
      const query = { q: "", category: f.categorySlug };
      expect(await service.highlights(query)).toHaveLength(1);
      await tx.product.update({
        where: { id: f.productId },
        data: { status: "DRAFT" },
      });
      expect(await service.highlights(query)).toHaveLength(0);
      expect(
        (await service.categories()).some((c) => c.id === f.categoryId),
      ).toBe(false);
      await tx.product.update({
        where: { id: f.productId },
        data: { status: "ACTIVE", deletedAt: new Date() },
      });
      expect(await service.highlights(query)).toHaveLength(0);
      await tx.product.update({
        where: { id: f.productId },
        data: { deletedAt: null },
      });
      await tx.seller.update({
        where: { id: f.sellerId },
        data: { status: "SUSPENDED" },
      });
      expect(await service.highlights(query)).toHaveLength(0);
      await tx.seller.update({
        where: { id: f.sellerId },
        data: { status: "APPROVED" },
      });
      await tx.category.update({
        where: { id: f.categoryId },
        data: { isActive: false },
      });
      expect(await service.highlights(query)).toHaveLength(0);
    });
  });
  it("pesquisa sem distinguir maiúsculas, respeita reservas e ignora variantes inactivas mais baratas", async () => {
    await withFixture(async (tx, f) => {
      const service = new LandingService(tx);
      await tx.productVariant.create({
        data: {
          productId: f.productId,
          sku: randomUUID(),
          label: "Oculta",
          unit: "KG",
          unitSize: 1,
          priceCents: 1,
          isActive: false,
        },
      });
      const result = await service.highlights({
        q: "MILHO",
        category: f.categorySlug,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        priceCents: 15000,
        available: false,
        label: "1 kg",
      });
      expect(
        await service.highlights({
          q: "inexistente",
          category: f.categorySlug,
        }),
      ).toHaveLength(0);
      await tx.inventory.update({
        where: { variantId: f.variantId },
        data: { quantityReserved: 1 },
      });
      expect(
        (await service.highlights({ q: "milho", category: f.categorySlug }))[0]
          ?.available,
      ).toBe(true);
    });
  });
});
