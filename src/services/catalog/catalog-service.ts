import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { displayDescription, displayName } from "@/lib/display-name";

const PAGE_SIZE = 12;
const MAX_PAGE = 10_000;

export type CatalogSort =
  "relevance" | "recent" | "price-asc" | "price-desc" | "name";

export type CatalogQueryInput = {
  q?: string | string[];
  categoria?: string | string[];
  ordenar?: string | string[];
  pagina?: string | string[];
  minimo?: string | string[];
  maximo?: string | string[];
  stock?: string | string[];
};

export type CatalogQuery = {
  q: string;
  category: string;
  sort: CatalogSort;
  page: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  inStock: boolean;
};

export function normalizeCatalogQuery(input: CatalogQueryInput): CatalogQuery {
  const q = typeof input.q === "string" ? input.q.trim().slice(0, 100) : "";
  const category =
    typeof input.categoria === "string" &&
    /^[a-z0-9][a-z0-9-]{0,99}$/.test(input.categoria)
      ? input.categoria
      : "";
  const validSorts: CatalogSort[] = [
    "relevance",
    "recent",
    "price-asc",
    "price-desc",
    "name",
  ];
  const sort =
    typeof input.ordenar === "string" &&
    validSorts.includes(input.ordenar as CatalogSort)
      ? (input.ordenar as CatalogSort)
      : q
        ? "relevance"
        : "recent";
  const pageNumber =
    typeof input.pagina === "string" && /^\d{1,5}$/.test(input.pagina)
      ? Number(input.pagina)
      : 1;
  const page = Math.max(1, Math.min(MAX_PAGE, pageNumber));
  const parsePrice = (value: string | string[] | undefined) => {
    if (typeof value !== "string" || !/^\d{1,7}(\.\d{1,2})?$/.test(value))
      return null;
    const amount = Number(value);
    return Number.isSafeInteger(Math.round(amount * 100)) && amount <= 1_000_000
      ? Math.round(amount * 100)
      : null;
  };
  const minPriceCents = parsePrice(input.minimo);
  const maxPriceCents = parsePrice(input.maximo);

  return {
    q,
    category,
    sort,
    page,
    minPriceCents:
      minPriceCents !== null &&
      maxPriceCents !== null &&
      minPriceCents > maxPriceCents
        ? maxPriceCents
        : minPriceCents,
    maxPriceCents:
      minPriceCents !== null &&
      maxPriceCents !== null &&
      minPriceCents > maxPriceCents
        ? minPriceCents
        : maxPriceCents,
    inStock: input.stock === "1",
  };
}

export type CatalogProductCard = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  seller: string;
  label: string;
  priceCents: number;
  available: boolean;
  ratingAvg: number;
  ratingCount: number;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type CatalogPage = {
  products: CatalogProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CatalogDb = Pick<
  PrismaClient,
  "category" | "product" | "productSlugHistory" | "$queryRaw"
>;

const publicProductWhere: Prisma.ProductWhereInput = {
  status: "ACTIVE",
  deletedAt: null,
  category: { isActive: true, deletedAt: null },
  seller: {
    status: "APPROVED",
    deletedAt: null,
    user: { status: "ACTIVE", deletedAt: null },
  },
  variants: { some: { isActive: true, deletedAt: null } },
};

export function publicImageUrl(storageKey: string): string | null {
  if (storageKey.startsWith("/") && !storageKey.startsWith("//"))
    return storageKey;
  try {
    const url = new URL(storageKey);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

type ProductWithCardFields = Prisma.ProductGetPayload<{
  select: {
    id: true;
    slug: true;
    name: true;
    brand: true;
    ratingAvg: true;
    ratingCount: true;
    category: { select: { name: true; slug: true } };
    seller: { select: { businessName: true } };
    images: {
      select: { storageKey: true; alt: true; sortOrder: true; isPrimary: true };
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }];
      take: 1;
    };
    variants: {
      where: { isActive: true; deletedAt: null };
      select: {
        label: true;
        priceCents: true;
        inventory: { select: { quantityOnHand: true; quantityReserved: true } };
      };
      orderBy: [{ priceCents: "asc" }, { id: "asc" }];
    };
  };
}>;

function toCard(product: ProductWithCardFields): CatalogProductCard | null {
  const variant = product.variants[0];
  if (!variant) return null;
  const image = product.images[0];
  return {
    id: product.id,
    slug: product.slug,
    name: displayName(product.name),
    brand: product.brand ? displayName(product.brand) : null,
    category: displayName(product.category.name),
    categorySlug: product.category.slug,
    seller: displayName(product.seller.businessName),
    label: displayName(variant.label),
    priceCents: variant.priceCents,
    available: product.variants.some(
      (option) =>
        (option.inventory?.quantityOnHand ?? 0) -
          (option.inventory?.quantityReserved ?? 0) >
        0,
    ),
    ratingAvg: Number(product.ratingAvg),
    ratingCount: product.ratingCount,
    imageUrl: image ? publicImageUrl(image.storageKey) : null,
    imageAlt: image?.alt ? displayName(image.alt) : null,
  };
}

export class CatalogService {
  constructor(private readonly db: CatalogDb) {}

  async categories() {
    const rows = await this.db.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        products: { some: publicProductWhere },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((category) => ({
      ...category,
      name: displayName(category.name),
      description: category.description
        ? displayName(category.description)
        : null,
    }));
  }

  async list(query: CatalogQuery): Promise<CatalogPage> {
    const search = query.q ? `%${query.q.replace(/[\\%_]/g, "\\$&")}%` : null;
    const searchClause = query.q
      ? Prisma.sql`AND (
          p."search_vector" @@ websearch_to_tsquery('portuguese', immutable_unaccent(${query.q}))
          OR p."name" ILIKE ${search} ESCAPE CHR(92)
          OR COALESCE(p."brand", '') ILIKE ${search} ESCAPE CHR(92)
          OR COALESCE(p."description", '') ILIKE ${search} ESCAPE CHR(92)
        )`
      : Prisma.empty;
    const categoryClause = query.category
      ? Prisma.sql`AND c."slug" = ${query.category}`
      : Prisma.empty;
    const stockClause = query.inStock
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM "inventories" stock
          WHERE stock."variant_id" = v."id"
            AND stock."quantity_on_hand" > stock."quantity_reserved"
        )`
      : Prisma.empty;
    const minClause =
      query.minPriceCents === null
        ? Prisma.empty
        : Prisma.sql`AND (
            SELECT MIN(min_variant."price_cents")
            FROM "product_variants" min_variant
            WHERE min_variant."product_id" = p."id"
              AND min_variant."is_active" = true
              AND min_variant."deleted_at" IS NULL
          ) >= ${query.minPriceCents}`;
    const maxClause =
      query.maxPriceCents === null
        ? Prisma.empty
        : Prisma.sql`AND (
            SELECT MIN(max_variant."price_cents")
            FROM "product_variants" max_variant
            WHERE max_variant."product_id" = p."id"
              AND max_variant."is_active" = true
              AND max_variant."deleted_at" IS NULL
          ) <= ${query.maxPriceCents}`;
    const whereClause = Prisma.sql`
      FROM "products" p
      JOIN "categories" c ON c."id" = p."category_id"
      JOIN "sellers" s ON s."id" = p."seller_id"
      JOIN "users" u ON u."id" = s."user_id"
      JOIN "product_variants" v ON v."product_id" = p."id"
        AND v."is_active" = true AND v."deleted_at" IS NULL
      WHERE p."status" = 'ACTIVE' AND p."deleted_at" IS NULL
        AND c."is_active" = true AND c."deleted_at" IS NULL
        AND s."status" = 'APPROVED' AND s."deleted_at" IS NULL
        AND u."status" = 'ACTIVE' AND u."deleted_at" IS NULL
        ${searchClause} ${categoryClause} ${stockClause} ${minClause} ${maxClause}
    `;
    const orderBy =
      query.sort === "price-asc"
        ? Prisma.sql`MIN(v."price_cents") ASC, p."id" ASC`
        : query.sort === "price-desc"
          ? Prisma.sql`MIN(v."price_cents") DESC, p."id" ASC`
          : query.sort === "name"
            ? Prisma.sql`p."name" ASC, p."id" ASC`
            : query.sort === "relevance" && query.q
              ? Prisma.sql`MAX(ts_rank(p."search_vector", websearch_to_tsquery('portuguese', immutable_unaccent(${query.q})))) DESC, p."created_at" DESC, p."id" ASC`
              : Prisma.sql`p."created_at" DESC, p."id" ASC`;
    const offset = (query.page - 1) * PAGE_SIZE;
    const [countRows, pageRows] = await Promise.all([
      this.db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(DISTINCT p."id") AS "count" ${whereClause}
      `),
      this.db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT p."id" ${whereClause}
        GROUP BY p."id"
        ORDER BY ${orderBy}
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `),
    ]);
    const total = Number(countRows[0]?.count ?? BigInt(0));
    const ids = pageRows.map(({ id }) => id);
    if (!ids.length)
      return {
        products: [],
        total,
        page: query.page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      };

    const records = await this.db.product.findMany({
      where: { ...publicProductWhere, id: { in: ids } },
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        ratingAvg: true,
        ratingCount: true,
        category: { select: { name: true, slug: true } },
        seller: { select: { businessName: true } },
        images: {
          select: {
            storageKey: true,
            alt: true,
            sortOrder: true,
            isPrimary: true,
          },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
        variants: {
          where: { isActive: true, deletedAt: null },
          select: {
            label: true,
            priceCents: true,
            inventory: {
              select: { quantityOnHand: true, quantityReserved: true },
            },
          },
          orderBy: [{ priceCents: "asc" }, { id: "asc" }],
        },
      },
    });
    const byId = new Map(records.map((product) => [product.id, product]));
    const products = ids
      .map((id) => byId.get(id))
      .filter((product): product is ProductWithCardFields => Boolean(product))
      .map(toCard)
      .filter((product): product is CatalogProductCard => Boolean(product));

    return {
      products,
      total,
      page: query.page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  async productBySlug(slug: string) {
    const product = await this.db.product.findFirst({
      where: { ...publicProductWhere, slug },
      select: productDetailSelect,
    });
    if (product) return mapProductDetail(product, slug);

    const history = await this.db.productSlugHistory.findFirst({
      where: { slug, product: publicProductWhere },
      select: {
        product: {
          select: productDetailSelect,
        },
      },
    });
    if (!history?.product) return null;
    return mapProductDetail(history.product, slug);
  }

  async related(productId: string, categoryId: string) {
    const records = await this.db.product.findMany({
      where: {
        ...publicProductWhere,
        id: { not: productId },
        categoryId,
      },
      select: productCardSelect,
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      take: 4,
    });
    return records
      .map(toCard)
      .filter((product): product is CatalogProductCard => Boolean(product));
  }

  async publicSlugs() {
    return this.db.product.findMany({
      where: publicProductWhere,
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50_000,
    });
  }
}

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  ratingAvg: true,
  ratingCount: true,
  category: { select: { name: true, slug: true } },
  seller: { select: { businessName: true } },
  images: {
    select: { storageKey: true, alt: true, sortOrder: true, isPrimary: true },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1,
  },
  variants: {
    where: { isActive: true, deletedAt: null },
    select: {
      label: true,
      priceCents: true,
      inventory: { select: { quantityOnHand: true, quantityReserved: true } },
    },
    orderBy: [{ priceCents: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  description: true,
  ratingAvg: true,
  ratingCount: true,
  categoryId: true,
  category: { select: { name: true, slug: true, description: true } },
  seller: {
    select: {
      businessName: true,
      slug: true,
      description: true,
      ratingAvg: true,
      ratingCount: true,
    },
  },
  images: {
    select: { storageKey: true, alt: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  },
  variants: {
    where: { isActive: true, deletedAt: null },
    select: {
      id: true,
      label: true,
      unit: true,
      unitSize: true,
      priceCents: true,
      compareAtPriceCents: true,
      isDefault: true,
      inventory: { select: { quantityOnHand: true, quantityReserved: true } },
    },
    orderBy: [{ isDefault: "desc" }, { priceCents: "asc" }, { id: "asc" }],
  },
  reviews: {
    where: { status: "PUBLISHED" },
    select: {
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  },
} satisfies Prisma.ProductSelect;

type ProductDetailRecord = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

function mapProductDetail(product: ProductDetailRecord, requestedSlug: string) {
  const images = product.images
    .map((image) => ({
      url: publicImageUrl(image.storageKey),
      alt: image.alt ? displayName(image.alt) : null,
      sortOrder: image.sortOrder,
    }))
    .filter(
      (
        image,
      ): image is { url: string; alt: string | null; sortOrder: number } =>
        Boolean(image.url),
    );
  return {
    id: product.id,
    slug: product.slug,
    requestedSlug,
    name: displayName(product.name),
    brand: product.brand ? displayName(product.brand) : null,
    description: product.description
      ? displayDescription(product.description)
      : null,
    categoryId: product.categoryId,
    category: {
      ...product.category,
      name: displayName(product.category.name),
      description: product.category.description
        ? displayName(product.category.description)
        : null,
    },
    seller: {
      ...product.seller,
      businessName: displayName(product.seller.businessName),
      ratingAvg: Number(product.seller.ratingAvg),
    },
    ratingAvg: Number(product.ratingAvg),
    ratingCount: product.ratingCount,
    images,
    variants: product.variants.map((variant) => ({
      ...variant,
      unitSize: Number(variant.unitSize),
      available: Math.max(
        0,
        (variant.inventory?.quantityOnHand ?? 0) -
          (variant.inventory?.quantityReserved ?? 0),
      ),
    })),
    reviews: product.reviews.map((review) => ({
      ...review,
      user: { ...review.user, name: displayName(review.user.name) },
    })),
  };
}

// Exported so both the catalogue page and metadata use identical visibility rules.
export function catalogPublicProductWhere(): Prisma.ProductWhereInput {
  return publicProductWhere;
}

export function toCatalogProductCard(product: ProductWithCardFields) {
  return toCard(product);
}

export { productCardSelect };
