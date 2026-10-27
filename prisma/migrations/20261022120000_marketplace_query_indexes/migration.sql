-- Indexes used by the public catalogue, detail pages and saved products.
CREATE INDEX "products_active_category_recent_idx"
  ON "products" ("category_id", "created_at" DESC, "id")
  WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL;

CREATE INDEX "product_variants_active_product_price_idx"
  ON "product_variants" ("product_id", "price_cents", "id")
  WHERE "is_active" = true AND "deleted_at" IS NULL;

CREATE INDEX "product_images_product_gallery_idx"
  ON "product_images" ("product_id", "is_primary" DESC, "sort_order");

CREATE INDEX "favorites_user_created_idx"
  ON "favorites" ("user_id", "created_at" DESC);

CREATE INDEX "reviews_public_product_recent_idx"
  ON "reviews" ("product_id", "created_at" DESC)
  WHERE "status" = 'PUBLISHED';
