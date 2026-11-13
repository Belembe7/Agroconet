import type { Prisma } from "@/generated/prisma/client";

const demoVariantWhere: Prisma.ProductVariantWhereInput = {
  OR: [
    { sku: { startsWith: "DEV-" } },
    { sku: { startsWith: "DEMO-" } },
    { sku: { startsWith: "EST-FEATURED-" } },
  ],
};

export const realUserWhere: Prisma.UserWhereInput = {
  NOT: {
    OR: [
      { name: { startsWith: "[DEV]" } },
      { email: { endsWith: "@dev.agroconet.local" } },
      { email: { endsWith: "@example.invalid" } },
    ],
  },
};

const demoSellerWhere: Prisma.SellerWhereInput = {
  OR: [
    { businessName: { startsWith: "[DEV]" } },
    { slug: { startsWith: "demo-" } },
    {
      user: {
        is: {
          OR: [
            { name: { startsWith: "[DEV]" } },
            { email: { endsWith: "@dev.agroconet.local" } },
            { email: { endsWith: "@example.invalid" } },
          ],
        },
      },
    },
  ],
};

export const realSellerWhere: Prisma.SellerWhereInput = {
  AND: [
    { NOT: { businessName: { startsWith: "[DEV]" } } },
    { NOT: { slug: { startsWith: "demo-" } } },
    { user: { is: realUserWhere } },
  ],
};

export const realProductWhere: Prisma.ProductWhereInput = {
  AND: [
    { deletedAt: null },
    { seller: { is: realSellerWhere } },
    { NOT: { name: { startsWith: "[DEV]" } } },
    { variants: { none: demoVariantWhere } },
    {
      OR: [
        { description: null },
        {
          AND: [
            { description: { not: { startsWith: "Dados estimados:" } } },
            { description: { not: { contains: "Produto de demonstração" } } },
            {
              description: {
                not: { startsWith: "Produto de desenvolvimento:" },
              },
            },
          ],
        },
      ],
    },
  ],
};

export const realOrderWhere: Prisma.OrderWhereInput = {
  AND: [
    { user: { is: realUserWhere } },
    { sellerOrders: { none: { seller: { is: demoSellerWhere } } } },
    {
      sellerOrders: {
        none: { items: { some: { variant: { is: demoVariantWhere } } } },
      },
    },
  ],
};

export const realDeliveryWhere: Prisma.DeliveryWhereInput = {
  sellerOrder: {
    is: {
      seller: { is: realSellerWhere },
      order: { is: realOrderWhere },
    },
  },
};

export const realDriverWhere: Prisma.DriverWhereInput = {
  AND: [{ deletedAt: null }, { user: { is: realUserWhere } }],
};

export const realCategoryWhere: Prisma.CategoryWhereInput = {
  AND: [{ deletedAt: null }, { NOT: { name: { startsWith: "[DEV]" } } }],
};

export const realDeliveryZoneWhere: Prisma.DeliveryZoneWhereInput = {
  AND: [{ isActive: true }, { NOT: { name: { startsWith: "[DEV]" } } }],
};

export const realAuditLogWhere: Prisma.AuditLogWhereInput = {
  OR: [{ actorUserId: null }, { actorUser: { is: realUserWhere } }],
};
