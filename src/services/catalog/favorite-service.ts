import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  catalogPublicProductWhere,
  productCardSelect,
  toCatalogProductCard,
} from "@/services/catalog/catalog-service";

type FavoriteDb = Pick<PrismaClient, "favorite" | "product">;

export class FavoriteService {
  constructor(private readonly db: FavoriteDb) {}

  async isSaved(userId: string, productId: string) {
    const row = await this.db.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { productId: true },
    });
    return Boolean(row);
  }

  async toggleBySlug(userId: string, slug: string) {
    const product = await this.db.product.findFirst({
      where: { ...catalogPublicProductWhere(), slug },
      select: { id: true },
    });
    if (!product)
      return {
        ok: false as const,
        error: "Este produto já não está disponível.",
      };

    const where = { userId_productId: { userId, productId: product.id } };
    const existing = await this.db.favorite.findUnique({
      where,
      select: { productId: true },
    });
    if (existing) {
      await this.db.favorite.delete({ where });
      return { ok: true as const, saved: false };
    }
    try {
      await this.db.favorite.create({
        data: { userId, productId: product.id },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
    }
    return { ok: true as const, saved: true };
  }

  async list(userId: string) {
    const rows = await this.db.favorite.findMany({
      where: {
        userId,
        product: catalogPublicProductWhere(),
      },
      select: {
        product: { select: productCardSelect },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows
      .map((row) => toCatalogProductCard(row.product))
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      );
  }
}
