ALTER TABLE "products"
  ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "products_active_featured_recent_idx"
  ON "products" ("is_featured" DESC, "created_at" DESC, "id")
  WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL;
