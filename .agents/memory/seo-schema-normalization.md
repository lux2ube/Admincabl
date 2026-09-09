---
name: SEO schema normalization
description: SEO entities use canonical relationships while legacy catalog fields remain for compatibility.
---

Canonical SEO relationships should use dedicated brand records and stable slugs, while the imported product brand text remains readable as a compatibility fallback until all admin/catalog writes use brand IDs.

**Why:** The imported database stores product brands as text and has no brands table; removing or renaming that field immediately would risk breaking existing seed and catalog flows.

**How to apply:** Resolve product brand data from `brand_id` first and fall back to the legacy brand text. Derive canonical URLs from stored slugs rather than persisting duplicate canonical URL strings.