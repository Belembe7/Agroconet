import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublicProductSlugs } from "@/features/catalog/data";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const products = await getPublicProductSlugs();
  return [
    {
      url: base,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/produtos`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...products.map((product) => ({
      url: `${base}/produtos/${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
