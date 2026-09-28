-- Apply after `pnpm --filter @workspace/db run push` on development Supabase.
-- Preserve legacy single-category links while making the new assignment model
-- authoritative for product-attribute eligibility.
BEGIN;

UPDATE "attributes"
SET "is_global" = ("category_id" IS NULL);

INSERT INTO "category_attributes"
  ("category_id", "attribute_id", "visible", "sort_order", "is_required", "is_filterable")
SELECT "category_id", "id", TRUE, "sort_order", FALSE, "is_filterable"
FROM "attributes"
WHERE "category_id" IS NOT NULL
ON CONFLICT ("category_id", "attribute_id") DO NOTHING;

COMMIT;