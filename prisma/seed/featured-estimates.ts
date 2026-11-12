import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  ProductStatus,
  ProductUnit,
} from "../../src/generated/prisma/client";

const explicitVercelOptIn =
  process.env.VERCEL === "1" &&
  process.env.AGROCONET_LOAD_ESTIMATED_FEATURED === "1";
const enabledForVercelEnvironment =
  explicitVercelOptIn &&
  (process.env.VERCEL_ENV === "preview" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.AGROCONET_ALLOW_ESTIMATED_FEATURED_PRODUCTION === "1"));

if (process.env.NODE_ENV === "production" && !enabledForVercelEnvironment) {
  throw new Error(
    "Estimated featured products require explicit opt-in for Vercel Preview or Production",
  );
}
if (process.env.AGROCONET_LOAD_ESTIMATED_FEATURED !== "1") {
  throw new Error(
    "Set AGROCONET_LOAD_ESTIMATED_FEATURED=1 to load the estimated featured seeds.",
  );
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const databaseUrl = new URL(connectionString);
if (
  !["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(
    databaseUrl.hostname,
  )
  && !enabledForVercelEnvironment
) {
  throw new Error(
    "Estimated products can only be loaded locally or in an explicitly enabled Vercel environment.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const description =
  "Dados estimados: preço, embalagem e stock são provisórios. Fornecedor por confirmar. Confirme os dados antes de efectuar a compra.";

const seeds = [
  {
    name: "Semente de cebola Soli",
    slug: "semente-cebola-soli-estimada",
    image: "semente-cebola-soli.png",
    sku: "EST-FEATURED-009",
    unitSize: 5,
    priceCents: 20000,
    stock: 30,
  },
  {
    name: "Semente de quiabo Clemson Spineless",
    slug: "semente-quiabo-clemson-spineless-estimado",
    image: "semente-quiabo-clemson-spineless.png",
    sku: "EST-FEATURED-008",
    unitSize: 5,
    priceCents: 25000,
    stock: 35,
  },
  {
    name: "Semente de melancia F1 Thor",
    slug: "semente-melancia-f1-thor-estimada",
    image: "semente-melancia-f1-thor.png",
    sku: "EST-FEATURED-007",
    unitSize: 5,
    priceCents: 35000,
    stock: 30,
  },
  {
    name: "Semente de tomate F1 Anaya",
    slug: "semente-tomate-f1-anaya-estimada",
    image: "semente-tomate-f1-anaya.png",
    sku: "EST-FEATURED-006",
    unitSize: 5,
    priceCents: 50000,
    stock: 35,
  },
  {
    name: "Semente de beterraba Crimson Globe",
    slug: "semente-beterraba-crimson-globe-estimada",
    image: "semente-beterraba-crimson-globe.png",
    sku: "EST-FEATURED-005",
    unitSize: 10,
    priceCents: 20000,
    stock: 40,
  },
  {
    name: "Semente de repolho Red Ball 2 F1",
    slug: "semente-repolho-red-ball-2-estimada",
    image: "semente-repolho-red-ball-2.png",
    sku: "EST-FEATURED-004",
    unitSize: 5,
    priceCents: 30000,
    stock: 25,
  },
  {
    name: "Semente de cebola Red Creole",
    slug: "semente-cebola-red-creole-estimada",
    image: "semente-cebola-red-creole.png",
    sku: "EST-FEATURED-002",
    unitSize: 5,
    priceCents: 20000,
    stock: 30,
  },
  {
    name: "Semente de salsa comum",
    slug: "semente-salsa-comum-estimada",
    image: "semente-salsa-commun-2.png",
    sku: "EST-FEATURED-001",
    unitSize: 5,
    priceCents: 15000,
    stock: 40,
  },
] as const;

async function main() {
  const [category, demoSeller, legacySeller] = await Promise.all([
    prisma.category.upsert({
      where: { slug: "sementes" },
      update: { isActive: true, deletedAt: null },
      create: { name: "Sementes", slug: "sementes", sortOrder: 1 },
    }),
    prisma.seller.findFirst({
      where: {
        slug: "demo-agroconet",
        status: "APPROVED",
        deletedAt: null,
        user: { status: "ACTIVE", deletedAt: null },
      },
    }),
    prisma.seller.findFirst({
      where: {
        slug: "agroconet",
        status: "APPROVED",
        deletedAt: null,
        user: { status: "ACTIVE", deletedAt: null },
      },
    }),
  ]);
  const seller = demoSeller ?? legacySeller;
  if (!seller) {
    throw new Error(
      "The approved demo Agroconet seller (demo-agroconet) is missing.",
    );
  }
  let created = 0;
  await prisma.product.updateMany({
    where: {
      slug: "semente-pepino-f1-nagano-estimada",
      description: { startsWith: "Dados estimados:" },
    },
    data: { status: ProductStatus.INACTIVE },
  });

  for (const seed of [...seeds].reverse()) {
    const existing = await prisma.product.findUnique({
      where: { slug: seed.slug },
      select: { id: true },
    });
    const product = await prisma.product.upsert({
      where: { slug: seed.slug },
      create: {
        sellerId: seller.id,
        categoryId: category.id,
        name: seed.name,
        slug: seed.slug,
        description,
        status: ProductStatus.ACTIVE,
        reviewedAt: new Date(),
      },
      update: {
        sellerId: seller.id,
        categoryId: category.id,
        name: seed.name,
        description,
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
    });

    const image = await prisma.productImage.findFirst({
      where: { productId: product.id },
      select: { id: true },
    });
    const imageData = {
      storageKey: `/images/products/${seed.image}`,
      alt: seed.name,
      isPrimary: true,
      sortOrder: 0,
    };
    if (image) {
      await prisma.productImage.update({
        where: { id: image.id },
        data: imageData,
      });
    } else {
      await prisma.productImage.create({
        data: { productId: product.id, ...imageData },
      });
    }

    const variant = await prisma.productVariant.upsert({
      where: { sku: seed.sku },
      create: {
        productId: product.id,
        sku: seed.sku,
        label: `${seed.unitSize} G · estimado`,
        unit: ProductUnit.G,
        unitSize: seed.unitSize,
        priceCents: seed.priceCents,
        isDefault: true,
        isActive: true,
      },
      update: {
        productId: product.id,
        label: `${seed.unitSize} G · estimado`,
        unit: ProductUnit.G,
        unitSize: seed.unitSize,
        priceCents: seed.priceCents,
        isDefault: true,
        isActive: true,
        deletedAt: null,
      },
    });

    const inventory = await prisma.inventory.findUnique({
      where: { variantId: variant.id },
      select: { variantId: true },
    });
    if (!inventory) {
      await prisma.$transaction([
        prisma.inventory.create({
          data: { variantId: variant.id, quantityOnHand: seed.stock },
        }),
        prisma.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: "IN",
            quantity: seed.stock,
            balanceAfter: seed.stock,
            reason: "Stock estimado para apresentação",
            referenceType: "ESTIMATED_FEATURED_SEED",
          },
        }),
      ]);
    }
    if (!existing) created += 1;
  }

  console.log("Estimated featured seeds ready", {
    created,
    total: seeds.length,
    seller: "pending confirmation",
  });
}

main()
  .catch((error: unknown) => {
    console.error(
      "Could not load estimated featured seeds",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
