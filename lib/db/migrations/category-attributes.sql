-- Apply after `pnpm --filter @workspace/db run push` on development Supabase.
-- Preserve legacy single-category links while making the new assignment model
-- authoritative for product-attribute eligibility. A missing legacy link does
-- not make an attribute global; global availability must be selected explicitly.
-- Existing saved product values also establish known category relationships.
-- Backfill those pairs before adding new links, so a newly linked attribute
-- does not disappear from other products that already use it.
BEGIN;

UPDATE "attributes"
SET "is_global" = FALSE
WHERE "category_id" IS NOT NULL;

INSERT INTO "category_attributes"
  ("category_id", "attribute_id", "visible", "sort_order", "is_required", "is_filterable")
SELECT "category_id", "id", TRUE, "sort_order", FALSE, "is_filterable"
FROM "attributes"
WHERE "category_id" IS NOT NULL
ON CONFLICT ("category_id", "attribute_id") DO NOTHING;

INSERT INTO "category_attributes"
  ("category_id", "attribute_id", "visible", "sort_order", "is_required", "is_filterable")
SELECT DISTINCT pc."category_id", pa."attribute_id", TRUE, a."sort_order", FALSE, a."is_filterable"
FROM "product_attributes" pa
JOIN "product_categories" pc ON pc."product_id" = pa."product_id"
JOIN "attributes" a ON a."id" = pa."attribute_id"
WHERE a."is_global" = FALSE
ON CONFLICT ("category_id", "attribute_id") DO NOTHING;

COMMIT;