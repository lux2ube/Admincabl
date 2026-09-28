---
name: CABL category attributes
description: Rules for category-dependent attribute selection in the CABL admin product editor.
---

Use `attributes` and `product_attributes` as the canonical model for editable product facts. Reuse definitions through `category_attributes`; category assignment is the default eligibility path, while global availability must be explicitly enabled. A missing legacy category link does not mean an attribute is global. Keep visibility, order, required, and filter rules on each category assignment. Preserve existing values visibly when a product loses a matching category, and flag them as no longer applicable.

Keep `specification_definitions` and `category_specification_definitions` in place for existing storefront modules until their consumers can be migrated safely. Do not move product values or verified source metadata into a definition model that does not own those values. Specifications describe product facts; values that distinguish separately purchasable SKUs belong in the variant model.

**Why:** Product values and their source metadata already reference `attributes`; treating every unlinked definition as global exposed unrelated properties in the product editor instead of limiting the choices to its linked categories.

**How to apply:** Add reusable product facts to the existing attribute/value model. Backfill only known category links; leave unlinked definitions unavailable unless an operator explicitly marks them global. Let category changes affect eligibility and presentation only, never silently delete saved values. Keep SKU-defining options in the variant model.