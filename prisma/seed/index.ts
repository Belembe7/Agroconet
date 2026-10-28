import "dotenv/config";
import { CATEGORIES, PRODUCTS } from "./catalog-data";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  DriverAvailability,
  DriverStatus,
  InventoryMovementType,
  OrderStatus,
  PrismaClient,
  ProductStatus,
  Role,
  SellerOrderStatus,
  SellerStatus,
  VehicleType,
  type User,
} from "../../src/generated/prisma/client";
import { InventoryService } from "../../src/services/inventory/inventory-service";

if (process.env.NODE_ENV === "production") {
  throw new Error("Seed must never run in production");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const inventory = new InventoryService(prisma);

const DEV_PASSWORD = "AgroconetDev1!";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("[DEV] Seeding Agroconet…");

  await prisma.stockReservation.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.sellerOrder.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.checkoutSession.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productSlugHistory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerApproval.deleteMany();
  await prisma.sellerDocument.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.sellerPayout.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.driverEarning.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.driverZone.deleteMany();
  await prisma.driverPayout.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notificationDelivery.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.user.deleteMany();

  const credentialPassword = await hashPassword(DEV_PASSWORD);

  async function createUserWithCredential(input: {
    phoneNumber: string;
    email: string;
    name: string;
    roles: { role: Role; grantedById?: string }[];
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        phoneNumber: input.phoneNumber,
        email: input.email,
        name: input.name,
        emailVerified: true,
        phoneNumberVerified: true,
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        roles: {
          create: input.roles.map((r) => ({
            role: r.role,
            grantedById: r.grantedById,
          })),
        },
      },
    });

    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        accountId: input.phoneNumber,
        providerId: "credential",
        password: credentialPassword,
      },
    });

    return user;
  }

  const zones = await Promise.all([
    prisma.deliveryZone.create({
      data: {
        name: "[DEV] Maputo Cidade",
        province: "Maputo",
        areas: ["KaMpfumo", "Nlhamankulu", "KaMaxakeni"],
        baseFeeCents: 15000,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: "[DEV] KaTembe",
        province: "Maputo",
        areas: ["KaTembe"],
        baseFeeCents: 25000,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: "[DEV] Matola",
        province: "Maputo",
        areas: ["Matola A", "Matola B", "Machava"],
        baseFeeCents: 20000,
      },
    }),
  ]);

  const superAdmin = await createUserWithCredential({
    phoneNumber: "+258840000001",
    email: "superadmin@dev.agroconet.local",
    name: "[DEV] Super Admin",
    roles: [{ role: Role.SUPER_ADMIN }],
  });

  const admin = await createUserWithCredential({
    phoneNumber: "+258840000002",
    email: "admin@dev.agroconet.local",
    name: "[DEV] Admin",
    roles: [{ role: Role.ADMIN, grantedById: superAdmin.id }],
  });

  const sellerDefs = [
    {
      phone: "+258840000011",
      name: "[DEV] Agroconet Loja",
      business: "[DEV] Agroconet",
      slug: "agroconet",
      zone: zones[0]!,
    },
    {
      phone: "+258840000012",
      name: "[DEV] Casa do Agricultor",
      business: "[DEV] Casa do Agricultor",
      slug: "casa-do-agricultor",
      zone: zones[0]!,
    },
    {
      phone: "+258840000013",
      name: "[DEV] Matola Agro",
      business: "[DEV] Matola Agro",
      slug: "matola-agro",
      zone: zones[2]!,
    },
    {
      phone: "+258840000014",
      name: "[DEV] Sementes Sul",
      business: "[DEV] Sementes Sul",
      slug: "sementes-sul",
      zone: zones[1]!,
    },
  ];

  const sellers = [];
  for (const def of sellerDefs) {
    const user = await createUserWithCredential({
      phoneNumber: def.phone,
      email: `${def.slug}@dev.agroconet.local`,
      name: def.name,
      roles: [{ role: Role.SELLER, grantedById: admin.id }],
    });
    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        businessName: def.business,
        phone: def.phone,
        province: "Maputo",
        district: def.zone.name.replace("[DEV] ", ""),
        addressText: "Armazém [DEV]",
        status: SellerStatus.APPROVED,
        pickupZoneId: def.zone.id,
        slug: def.slug,
        approvedAt: new Date(),
      },
    });
    sellers.push(seller);
  }

  const drivers = [];
  for (const [i, phone] of ["+258840000021", "+258840000022"].entries()) {
    const user = await createUserWithCredential({
      phoneNumber: phone,
      email: `driver${i + 1}@dev.agroconet.local`,
      name: `[DEV] Entregador ${i + 1}`,
      roles: [{ role: Role.DRIVER, grantedById: admin.id }],
    });
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        vehicleType: i === 0 ? VehicleType.MOTORCYCLE : VehicleType.CAR,
        plate: `DEV-0${i + 1}-MP`,
        status: DriverStatus.ACTIVE,
        availability: DriverAvailability.AVAILABLE,
        zones: {
          create: zones.map((z) => ({ zoneId: z.id })),
        },
      },
    });
    drivers.push(driver);
  }

  const customers = [];
  for (let i = 1; i <= 5; i++) {
    const base = await createUserWithCredential({
      phoneNumber: `+25884000003${i}`,
      email: `cliente${i}@dev.agroconet.local`,
      name: `[DEV] Cliente ${i}`,
      roles: [{ role: Role.CUSTOMER }],
    });
    await prisma.customer.create({ data: { userId: base.id } });
    const address = await prisma.address.create({
      data: {
        userId: base.id,
        label: "Casa",
        recipientName: `[DEV] Cliente ${i}`,
        phone: `+25884000003${i}`,
        province: "Maputo",
        district: "KaMpfumo",
        neighborhood: "Sommerschield",
        street: `Av. [DEV] ${i}`,
        reference: "Perto do mercado",
        zoneId: zones[0]!.id,
        isDefault: true,
      },
    });
    await prisma.customer.update({
      where: { userId: base.id },
      data: { defaultAddressId: address.id },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: base.id },
      include: { addresses: true, customer: true },
    });
    customers.push(user);
  }

  const categoryRows = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const row = await prisma.category.create({
      data: {
        name: `[DEV] ${cat.name}`,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        requiresReview: "requiresReview" in cat ? cat.requiresReview : false,
        defaultCommissionBps: 1000,
      },
    });
    categoryRows.set(cat.slug, row.id);
  }

  const variants: {
    id: string;
    priceCents: number;
    sellerId: string;
    name: string;
    label: string;
    sku: string;
  }[] = [];

  for (const [index, product] of PRODUCTS.entries()) {
    const seller = sellers[index % sellers.length]!;
    const categoryId = categoryRows.get(product.categorySlug)!;
    const slug = `${slugify(product.name)}-${index + 1}`;
    const created = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId,
        name: `[DEV] ${product.name}`,
        slug,
        description: `Produto de desenvolvimento: ${product.name}`,
        brand: product.brand,
        status: ProductStatus.ACTIVE,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        images: {
          create: {
            storageKey: `dev/products/${slug}.jpg`,
            alt: product.name,
            isPrimary: true,
          },
        },
        variants: {
          create: {
            sku: `DEV-${String(index + 1).padStart(3, "0")}`,
            label: `${product.unitSize} ${product.unit}`,
            unit: product.unit,
            unitSize: product.unitSize,
            priceCents: product.priceCents,
            isDefault: true,
            isActive: true,
          },
        },
      },
      include: { variants: true },
    });

    const variant = created.variants[0]!;
    await inventory.move({
      variantId: variant.id,
      type: InventoryMovementType.IN,
      quantity: product.stock,
      reason: "seed initial stock",
      actorUserId: admin.id,
    });

    variants.push({
      id: variant.id,
      priceCents: product.priceCents,
      sellerId: seller.id,
      name: created.name,
      label: variant.label,
      sku: variant.sku,
    });
  }

  const customer = customers[0]!;
  const address = customer.addresses[0]!;
  const v1 = variants[0]!;
  const v2 = variants[6]!;

  const orderPending = await prisma.order.create({
    data: {
      number: "AGC-2026-000001",
      userId: customer.id,
      status: OrderStatus.PENDING,
      subtotalCents: v1.priceCents,
      deliveryTotalCents: zones[0]!.baseFeeCents,
      totalCents: v1.priceCents + zones[0]!.baseFeeCents,
      shippingAddressSnapshot: address,
      contactPhone: customer.phoneNumber!,
      idempotencyKey: "dev-order-pending",
      sellerOrders: {
        create: {
          sellerId: v1.sellerId,
          status: SellerOrderStatus.PENDING,
          subtotalCents: v1.priceCents,
          deliveryFeeCents: zones[0]!.baseFeeCents,
          commissionCents: Math.round(v1.priceCents * 0.1),
          sellerNetCents: Math.round(v1.priceCents * 0.9),
          items: {
            create: {
              variantId: v1.id,
              productName: v1.name,
              variantLabel: v1.label,
              sku: v1.sku,
              unitPriceCents: v1.priceCents,
              quantity: 1,
              lineTotalCents: v1.priceCents,
              commissionBps: 1000,
              commissionCents: Math.round(v1.priceCents * 0.1),
            },
          },
        },
      },
    },
  });

  await prisma.order.create({
    data: {
      number: "AGC-2026-000002",
      userId: customers[1]!.id,
      status: OrderStatus.CONFIRMED,
      subtotalCents: v2.priceCents * 2,
      deliveryTotalCents: zones[2]!.baseFeeCents,
      totalCents: v2.priceCents * 2 + zones[2]!.baseFeeCents,
      shippingAddressSnapshot: customers[1]!.addresses[0]!,
      contactPhone: customers[1]!.phoneNumber!,
      idempotencyKey: "dev-order-confirmed",
      placedAt: new Date(),
      sellerOrders: {
        create: {
          sellerId: v2.sellerId,
          status: SellerOrderStatus.CONFIRMED,
          subtotalCents: v2.priceCents * 2,
          deliveryFeeCents: zones[2]!.baseFeeCents,
          commissionCents: Math.round(v2.priceCents * 2 * 0.1),
          sellerNetCents: Math.round(v2.priceCents * 2 * 0.9),
          confirmedAt: new Date(),
          items: {
            create: {
              variantId: v2.id,
              productName: v2.name,
              variantLabel: v2.label,
              sku: v2.sku,
              unitPriceCents: v2.priceCents,
              quantity: 2,
              lineTotalCents: v2.priceCents * 2,
              commissionBps: 1000,
              commissionCents: Math.round(v2.priceCents * 2 * 0.1),
            },
          },
        },
      },
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      {
        key: "commission.default_bps",
        value: 1000,
        description: "Comissão padrão da plataforma (10%)",
        updatedById: admin.id,
      },
      {
        key: "stock.reservation_minutes",
        value: 30,
        description: "TTL de reserva de stock no checkout",
        updatedById: admin.id,
      },
      {
        key: "company.contacts",
        value: {
          phone: "+258840000000",
          email: "contacto@agroconet.local",
          city: "Maputo",
        },
        description: "Contactos públicos [DEV]",
        updatedById: admin.id,
      },
    ],
  });

  console.log("[DEV] Seed complete");
  console.log(`  users: superadmin/admin/sellers/drivers/customers`);
  console.log(`  password: ${DEV_PASSWORD}`);
  console.log(`  products: ${PRODUCTS.length}`);
  console.log(`  sample order: ${orderPending.number}`);
  console.log(`  drivers: ${drivers.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
