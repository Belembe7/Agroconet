import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import {
  CatalogService,
  normalizeCatalogQuery,
} from "@/services/catalog/catalog-service";
import { CartService } from "@/services/cart/cart-service";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
afterAll(() => db.$disconnect());

async function withMarketplaceFixture(
  run: (
    tx: Prisma.TransactionClient,
    fixture: {
      categorySlug: string;
      productSlugs: [string, string];
      variantIds: [string, string];
      sellerIds: [string, string];
      userId: string;
    },
  ) => Promise<void>,
) {
  const rollback = new Error("ROLLBACK_MARKETPLACE_TEST");
  try {
    await db.$transaction(
      async (tx) => {
        const suffix = randomUUID();
        const users = await Promise.all(
          ["one", "two", "customer"].map((part) =>
            tx.user.create({
              data: {
                name: `Marketplace ${part}`,
                email: `${suffix}-${part}@test.local`,
                phoneNumber: `+258${randomUUID().replace(/\D/g, "").padEnd(9, "0").slice(0, 9)}`,
              },
            }),
          ),
        );
        const sellers = await Promise.all(
          users.slice(0, 2).map((user, index) =>
            tx.seller.create({
              data: {
                userId: user.id,
                businessName: `Marketplace seller ${index + 1}`,
                phone: user.phoneNumber!,
                province: "Maputo",
                district: "Maputo",
                addressText: "Test",
                slug: `market-seller-${index}-${suffix}`,
                status: "APPROVED",
              },
            }),
          ),
        );
        const category = await tx.category.create({
          data: { name: "Marketplace test", slug: `market-${suffix}` },
        });
        const products = await Promise.all(
          sellers.map((seller, index) =>
            tx.product.create({
              data: {
                name:
                  index === 0 ? "Semente milho teste" : "Fertilizante teste",
                brand: "Agro teste",
                slug: `market-${index}-${suffix}`,
                sellerId: seller.id,
                categoryId: category.id,
                status: "ACTIVE",
              },
            }),
          ),
        );
        const variants = await Promise.all(
          products.map((product, index) =>
            tx.productVariant.create({
              data: {
                productId: product.id,
                sku: `market-${index}-${suffix}`,
                label: index === 0 ? "Saco 5 kg" : "Frasco 1 L",
                unit: index === 0 ? "KG" : "L",
                unitSize: index === 0 ? 5 : 1,
                priceCents: index === 0 ? 12_500 : 40_000,
                inventory: {
                  create: {
                    quantityOnHand: index === 0 ? 5 : 3,
                    quantityReserved: 0,
                  },
                },
              },
            }),
          ),
        );
        await run(tx, {
          categorySlug: category.slug,
          productSlugs: [products[0]!.slug, products[1]!.slug],
          variantIds: [variants[0]!.id, variants[1]!.id],
          sellerIds: [sellers[0]!.id, sellers[1]!.id],
          userId: users[2]!.id,
        });
        throw rollback;
      },
      { timeout: 60_000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe("Marketplace catálogo e carrinho", () => {
  it("pesquisa produtos públicos com FTS e aplica categoria, preço e stock", async () => {
    await withMarketplaceFixture(async (tx, fixture) => {
      const service = new CatalogService(tx);
      const query = normalizeCatalogQuery({
        q: "milho",
        categoria: fixture.categorySlug,
        minimo: "100",
        maximo: "200",
        stock: "1",
      });
      const result = await service.list(query);
      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toMatchObject({
        slug: fixture.productSlugs[0],
        priceCents: 12_500,
        available: true,
      });

      await tx.seller.update({
        where: { id: fixture.sellerIds[0] },
        data: { status: "SUSPENDED" },
      });
      expect((await service.list(query)).total).toBe(0);
    });
  });

  it("merges guest lines into one customer cart while preserving two sellers and capping stock", async () => {
    await withMarketplaceFixture(async (tx, fixture) => {
      const service = new CartService(tx);
      const guest = await service.getOrCreateGuestCart("test-guest-token-hash");
      const customer = await service.getOrCreateUserCart(fixture.userId);

      expect(
        (await service.addItem(customer.id, fixture.variantIds[0], 1)).ok,
      ).toBe(true);
      expect(
        (await service.addItem(guest.id, fixture.variantIds[0], 4)).ok,
      ).toBe(true);
      expect(
        (await service.addItem(guest.id, fixture.variantIds[1], 2)).ok,
      ).toBe(true);
      await tx.inventory.update({
        where: { variantId: fixture.variantIds[1] },
        data: { quantityOnHand: 1 },
      });

      await service.mergeGuestIntoUser(fixture.userId, "test-guest-token-hash");
      const cart = await service.read({ userId: fixture.userId });
      expect(cart.groups).toHaveLength(2);
      expect(cart.groups.map((group) => group.sellerId).sort()).toEqual(
        [...fixture.sellerIds].sort(),
      );
      expect(cart.itemCount).toBe(6);
      expect(cart.totalCents).toBe(102_500);
      expect(
        cart.groups
          .flatMap((group) => group.items.map((item) => item.quantity))
          .sort((a, b) => a - b),
      ).toEqual([1, 5]);
    });
  });
});
