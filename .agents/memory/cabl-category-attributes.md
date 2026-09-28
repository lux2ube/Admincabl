---
name: CABL category attributes
description: Rules for category-dependent attribute selection in the CABL admin product editor.
---

Use `attributes` and `product_attributes` for generic product facts. Reuse those definitions through `category_attributes`; category assignment is the default eligibility path, while global availability must be explicitly enabled. A missing generic category link does not mean an attribute is global. Also include active, visible `specification_definitions` linked through `category_specification_definitions` in the product editor for the selected categories. Preserve existing generic values visibly when a product loses a matching category, and flag them as no longer applicable.

Keep `specification_definitions` and `category_specification_definitions` in place for existing storefront modules until their consumers can be migrated safely. Do not move product values or verified source metadata into a definition model that does not own those values. Specifications describe product facts; values that distinguish separately purchasable SKUs belong in the variant model.

When a category-linked legacy definition already has a value source, expose it using that source instead of copying its value into `product_attributes`. Map simple fields to their existing table columns and route structured fields such as dimensions and compatibility to their existing related-record editors. New reusable facts still belong in the generic attribute flow.

**Why:** Treating every unlinked definition as global exposed unrelated properties, while omitting category-linked legacy definitions hid valid fields such as a cable's connector A and B. Duplicating those values in the generic table would create conflicting storefront data; fixed electronics forms for every category would also block new product families.

**How to apply:** Use selected category assignments from both models to build the product's specification list. Keep generic facts in `product_attributes`; edit legacy facts in their existing specialized tables and link structured fields to their related editors. For new reusable attributes, use typed generic definitions and category links. Leave unlinked definitions unavailable unless an operator explicitly enables them globally. Category changes affect eligibility and presentation only, never delete saved values; keep SKU-defining options in the variant model.