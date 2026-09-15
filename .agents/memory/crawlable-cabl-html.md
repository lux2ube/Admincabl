---
name: Crawlable CABL HTML
description: The storefront’s static artifact needs route-level HTML for crawlers, not only client-side metadata.
---

Generate public route HTML from the live catalog during the storefront build, then hydrate the same routes with React. Keep canonical and JSON-LD injection idempotent because Vite transforms and the post-build renderer can both touch the document head.

**Why:** The static artifact’s SPA fallback returns a generic shell to crawlers on clean category, guide, brand, and product paths; Vite’s preview server also does not reliably emulate the artifact static host’s directory-index behavior.

**How to apply:** Keep the post-build pre-render and raw-HTML acceptance check in the storefront build path. Test representative category aliases, guides, brand/category routes, and at least one product page whenever route or SEO metadata changes.