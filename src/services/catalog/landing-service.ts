import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { displayName } from "@/lib/display-name";
import { publicImageUrl } from "@/services/catalog/catalog-service";

const LANDING_CATEGORY_ORDER = [
  "sementes",
  "cereais",
  "defensivos",
  "fertilizantes",
  "repelente",
  "medicamentos-veterinarios",
  "ferramentas",
];

const contactsSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,25}$/)
    .optional(),
  email: z.email().optional(),
  city: z.string().trim().min(1).max(100).optional(),
});
export type PublicContacts = z.infer<typeof contactsSchema>;
export function parsePublicContacts(value: unknown): PublicContacts | null {
  const parsed = contactsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
export function normalizeLandingQuery(input: {
  q?: string | string[];
  categoria?: string | string[];
}) {
  return {
    q: typeof input.q === "string" ? input.q.trim().slice(0, 100) : "",
    category:
      typeof input.categoria === "string" &&
      /^[a-z0-9-]{1,100}$/.test(input.categoria)
        ? input.categoria
        : "",
  };
}

/** Public read model: only published products from approved sellers are exposed. */
export class LandingService {
  constructor(
    private readonly db: Pick<
      PrismaClient,
      "category" | "product" | "systemSetting" | "deliveryZone"
    >,
  ) {}
  async categories() {
    const categories = await this.db.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 24,
      select: { id: true, name: true, slug: true, description: true },
    });
    const bySlug = new Map(
      categories.map((category) => [category.slug, category]),
    );
    return LANDING_CATEGORY_ORDER.flatMap((slug) => {
      const category = bySlug.get(slug);
      if (!category) return [];
      return [
        {
          ...category,
          name: displayName(category.name),
          description: category.description
            ? displayName(category.description)
            : null,
        },
      ];
    });
  }
  async highlights(query: { q: string; category: string }) {
    const products = await this.db.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        category: {
          isActive: true,
          deletedAt: null,
          ...(query.category ? { slug: query.category } : {}),
        },
        seller: {
          status: "APPROVED",
          deletedAt: null,
          user: { status: "ACTIVE", deletedAt: null },
        },
        variants: { some: { isActive: true, deletedAt: null } },
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" as const } },
                { brand: { contains: query.q, mode: "insensitive" as const } },
                {
                  description: {
                    contains: query.q,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 8,
      select: {
        id: true,
        name: true,
        brand: true,
        slug: true,
        category: { select: { name: true } },
        seller: { select: { businessName: true } },
        images: {
          select: { storageKey: true, alt: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
        variants: {
          where: { isActive: true, deletedAt: null },
          orderBy: [{ priceCents: "asc" }, { id: "asc" }],
          take: 1,
          select: {
            label: true,
            priceCents: true,
            inventory: {
              select: { quantityOnHand: true, quantityReserved: true },
            },
          },
        },
      },
    });
    return products.flatMap((product) => {
      const variant = product.variants[0];
      if (!variant) return [];
      const image = product.images[0];
      return [
        {
          id: product.id,
          name: displayName(product.name),
          slug: product.slug,
          brand: product.brand ? displayName(product.brand) : null,
          category: displayName(product.category.name),
          imageUrl: image ? publicImageUrl(image.storageKey) : null,
          imageAlt: image?.alt ? displayName(image.alt) : null,
          seller: displayName(product.seller.businessName),
          label: displayName(variant.label),
          priceCents: variant.priceCents,
          available:
            !!variant.inventory &&
            variant.inventory.quantityOnHand >
              variant.inventory.quantityReserved,
        },
      ];
    });
  }
  async contacts() {
    const setting = await this.db.systemSetting.findUnique({
      where: { key: "company.contacts" },
      select: { value: true },
    });
    const contacts = parsePublicContacts(setting?.value);
    return contacts
      ? {
          ...contacts,
          city: contacts.city ? displayName(contacts.city) : undefined,
        }
      : null;
  }
  async deliveryZones() {
    const zones = await this.db.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 20,
      select: { id: true, name: true, areas: true },
    });
    return zones.map((zone) => ({
      id: zone.id,
      name: displayName(zone.name),
      areas: Array.isArray(zone.areas)
        ? zone.areas
            .filter((area): area is string => typeof area === "string")
            .map(displayName)
        : [],
    }));
  }
}
