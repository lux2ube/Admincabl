---
name: CABL public route split
description: Frontend route shapes and SEO canonical shapes differ for standalone categories and brands.
---

Standalone storefront navigation uses the mounted app's explicit `/category/<database-slug>` and `/brand/<brand-slug>` routes. The SEO layer may expose canonical public paths such as `/cables`, `/hubs-adapters`, or `/<brand-slug>` for generated product URLs, but those paths are not interchangeable with the storefront's standalone page routes.

**Why:** The app router and SEO path builder evolved separately. Treating SEO canonical aliases as direct storefront routes produced category metadata misses and links that landed on the not-found route.

**How to apply:** Use raw catalog category slugs inside `/category/` for standalone category navigation; use `/brand/` for standalone brand pages; reserve `publicCategorySlug` and `brandCategoryPath` for brand/category product paths and other routes that explicitly support those aliases.