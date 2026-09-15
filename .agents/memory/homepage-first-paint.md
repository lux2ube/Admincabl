---
name: Homepage first paint
description: Performance boundary for the CABL storefront homepage hero.
---

The homepage hero is presentation-first content and must render without waiting for the catalog request or a lazy-loaded homepage route. Catalog-dependent sections can hydrate after the hero is visible.

**Why:** Catalog responses can take seconds in the current environment, and delaying the first visible brand message makes the storefront feel broken even when the API succeeds.

**How to apply:** Keep hero copy and decorative artwork static, avoid loading animations on the hero, and do not gate its first render on product/category data.