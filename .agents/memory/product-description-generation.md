---
name: Product description generation
description: The boundary and consistency rule for CABL product copy across API, storefront, prerendered HTML, and structured data.
---

Generate CABL product descriptions from the published catalog row plus structured specifications at the API boundary. Use the same full description for the product detail UI, prerendered product content, and JSON-LD; derive a short version for SEO meta descriptions. Missing specification fields must remain absent rather than being filled with assumptions, compatibility claims, or store-service promises.

**Why:** Product data is served through several paths (catalog API, direct SEO responses, React pages, and static SEO HTML). A single verified generator keeps the copy synchronized while preventing keyword templates from inventing product facts.

**How to apply:** When adding a product field, category, or SEO keyword rule, update the shared generator and validate all published products. Keep Arabic keyword phrases natural and use the store's confirmed policies only.