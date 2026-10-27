import "dotenv/config";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const term = "milho";
const pattern = `%${term}%`;

async function main() {
  try {
    const plan = await prisma.$queryRaw<Array<{ "QUERY PLAN": string }>>(
      Prisma.sql`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT p."id"
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
        AND (
          p."search_vector" @@ websearch_to_tsquery('portuguese', immutable_unaccent(${term}))
          OR p."name" ILIKE ${pattern} ESCAPE CHR(92)
          OR COALESCE(p."brand", '') ILIKE ${pattern} ESCAPE CHR(92)
          OR COALESCE(p."description", '') ILIKE ${pattern} ESCAPE CHR(92)
        )
      GROUP BY p."id"
      ORDER BY MAX(ts_rank(p."search_vector", websearch_to_tsquery('portuguese', immutable_unaccent(${term})))) DESC,
        p."created_at" DESC, p."id" ASC
      LIMIT 12 OFFSET 0
    `,
    );
    process.stdout.write(
      `${plan.map((row) => row["QUERY PLAN"]).join("\n")}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
