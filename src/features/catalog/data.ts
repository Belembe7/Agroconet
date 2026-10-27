import { cacheLife, cacheTag } from "next/cache";
import {
  CatalogService,
  type CatalogQuery,
} from "@/services/catalog/catalog-service";
import { prisma } from "@/lib/db";

export async function getCatalogCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories", "catalog");
  return new CatalogService(prisma).categories();
}

export async function getCatalogPage(query: CatalogQuery) {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products", "categories");
  return new CatalogService(prisma).list(query);
}

export async function getCatalogProduct(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products", `product-${slug}`);
  return new CatalogService(prisma).productBySlug(slug);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products", `related-${categoryId}`);
  return new CatalogService(prisma).related(productId, categoryId);
}

export async function getPublicProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", "products");
  return new CatalogService(prisma).publicSlugs();
}
