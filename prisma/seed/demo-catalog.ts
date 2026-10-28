import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, Role } from "../../src/generated/prisma/client";
import { CATEGORIES, PRODUCTS } from "./catalog-data";

// Explicit opt-in; this command never creates credentials or resets existing data.
if (process.env.AGROCONET_LOAD_DEMO_CATALOG !== "1") {
  throw new Error(
    "Set AGROCONET_LOAD_DEMO_CATALOG=1 for the demo database only.",
  );
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  // Each nested write is atomic; independent rows can resume after an interruption.
  const tx = prisma;
  const categories = new Map<string, string>();
  for (const category of CATEGORIES) {
    const row = await tx.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        requiresReview:
          "requiresReview" in category ? category.requiresReview : false,
      },
      create: category,
    });
    categories.set(category.slug, row.id);
  }

  const zones = [];
  for (const [index, zone] of [
    {
      name: "Maputo Cidade",
      areas: ["KaMpfumo", "Nlhamankulu", "KaMaxakeni"],
      baseFeeCents: 15000,
    },
    { name: "KaTembe", areas: ["KaTembe"], baseFeeCents: 25000 },
    {
      name: "Matola",
      areas: ["Matola A", "Matola B", "Machava"],
      baseFeeCents: 20000,
    },
  ].entries()) {
    zones.push(
      await tx.deliveryZone.upsert({
        where: { id: `00000000-0000-4000-8000-00000000000${index + 1}` },
        update: {},
        create: {
          ...zone,
          province: "Maputo",
          id: `00000000-0000-4000-8000-00000000000${index + 1}`,
        },
      }),
    );
  }

  const sellers = [];
  for (const [index, name] of [
    "Agroconet",
    "Casa do Agricultor",
    "Matola Agro",
    "Sementes Sul",
  ].entries()) {
    const slug = `demo-${slugify(name)}`;
    const zone = zones[index === 2 ? 2 : index === 3 ? 1 : 0]!;
    const existing = await tx.seller.findUnique({ where: { slug } });
    sellers.push(
      existing ??
        (await tx.seller.create({
          data: {
            slug,
            businessName: name,
            description: "Loja fictícia para demonstração do Agroconet.",
            phone: "+258000000000",
            province: "Maputo",
            district: zone.name,
            addressText: "Localização de demonstração",
            pickupZone: { connect: { id: zone.id } },
            status: "APPROVED",
            approvedAt: new Date(),
            user: {
              create: {
                name,
                email: `${slug}@example.invalid`,
                roles: { create: { role: Role.SELLER } },
              },
            },
          },
        })),
    );
  }

  let created = 0;
  for (const [index, product] of PRODUCTS.entries()) {
    const slug = `${slugify(product.name)}-${index + 1}`;
    if (await tx.product.findUnique({ where: { slug }, select: { id: true } }))
      continue;
    await tx.product.create({
      data: {
        name: product.name,
        slug,
        brand: product.brand,
        categoryId: categories.get(product.categorySlug)!,
        sellerId: sellers[index % sellers.length]!.id,
        description: `${product.name}. Produto de demonstração; preços e disponibilidade ilustrativos.`,
        status: "ACTIVE",
        reviewedAt: new Date(),
        variants: {
          create: {
            sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
            label: `${product.unitSize} ${product.unit}`,
            unit: product.unit,
            unitSize: product.unitSize,
            priceCents: product.priceCents,
            isDefault: true,
            isActive: true,
            inventory: { create: { quantityOnHand: product.stock } },
            inventoryMovements: {
              create: {
                type: "IN",
                quantity: product.stock,
                balanceAfter: product.stock,
                reason: "Stock ilustrativo da demonstração",
                referenceType: "DEMO_CATALOG",
              },
            },
          },
        },
      },
    });
    created += 1;
  }
  console.log("Demo catalogue ready", {
    created,
    categories: categories.size,
    sellers: sellers.length,
  });
}

main()
  .catch((error: unknown) => {
    console.error(
      "Demo catalogue failed",
      error instanceof Error ? error.name : "Unknown error",
    );
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error(error.message);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Database operation code", error.code);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
