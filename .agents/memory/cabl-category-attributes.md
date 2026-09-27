---
name: CABL category attributes
description: Rules for category-dependent attribute selection in the CABL admin product editor.
---

Treat `attributes.category_id` as the current single-category assignment; a null category means the attribute is global. For a product, offer active global attributes plus attributes assigned to any of its linked categories. Keep existing product attribute rows visible when category links change, and flag mismatched assignments instead of deleting or hiding their values.

Specifications describe product facts. Values that distinguish separately purchasable SKUs belong in the variant model rather than being treated as ordinary product specifications.

**Why:** Products may belong to several categories, and removing a category must not silently erase specifications. The current schema supports one category per attribute definition, so future reuse across several categories needs an explicit category-to-attribute assignment table rather than duplicated definitions.

**How to apply:** In future category-attribute work, preserve global attributes and existing product values, handle category-link cache invalidation, and add per-category ordering or required/filter settings only through an explicit assignment model.