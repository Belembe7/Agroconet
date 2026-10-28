-- Make existing pending purchases available in the delivery planner.
-- Existing deliveries and completed/cancelled purchases are preserved.
INSERT INTO "deliveries" (
  "id", "seller_order_id", "status", "pickup_address_snapshot", "dropoff_address_snapshot",
  "fee_cents", "driver_fee_cents", "created_at", "updated_at"
)
SELECT gen_random_uuid(), so."id", 'UNASSIGNED'::"DeliveryStatus",
  jsonb_build_object('businessName', s."business_name", 'phone', s."phone",
    'reference', s."address_text", 'province', s."province", 'district', s."district",
    'latitude', s."latitude", 'longitude', s."longitude"),
  o."shipping_address_snapshot", so."delivery_fee_cents", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "seller_orders" so
JOIN "orders" o ON o."id" = so."order_id"
JOIN "sellers" s ON s."id" = so."seller_id"
WHERE so."status" IN ('PENDING', 'CONFIRMED', 'READY_FOR_PICKUP')
  AND o."status" NOT IN ('DELIVERED', 'CANCELLED')
  AND NOT EXISTS (SELECT 1 FROM "deliveries" d WHERE d."seller_order_id" = so."id");
