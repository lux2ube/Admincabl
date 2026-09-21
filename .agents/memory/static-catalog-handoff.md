---
name: Static catalog handoff
description: The boundary between CABL prerendered SEO HTML and the interactive React storefront.
---

CABL's prerendered route HTML is deliberately custom crawlable markup, not the output of the interactive React tree. The browser should therefore replace that shell with `createRoot` and seed React Query from the escaped catalog JSON payload embedded in the page; do not switch this path to `hydrateRoot` without first making the server markup identical to the React tree.

**Why:** Hydrating the current SEO shell would create structural mismatches, while a build-time catalog payload removes the initial catalog round trip without sacrificing the no-JavaScript HTML.

**How to apply:** Keep the payload shape aligned with the `/store/catalog` response, validate its required top-level arrays before use, and retain a bounded freshness window so later catalog changes can still refresh the client cache.

The production static server must serve generated route files before applying an SPA fallback, and its fallback list must include every non-prerendered client route that should resolve in the browser, including legacy and dynamic routes.

**Why:** A static server can return a misleading 404 for a valid client-side route even when the React router knows how to render its empty state or redirect.

**How to apply:** When adding or testing a browser route, verify both its generated HTML/static-file path and its server fallback classification; keep legacy and dynamic route patterns explicit rather than relying on a catch-all that could mask missing SEO files.

Interactive catalog consumers must keep a valid embedded snapshot when a background catalog refresh fails; a failed refresh should not replace a usable page with an error boundary.

**Why:** The published Vercel API can fail independently of static route delivery when runtime database variables are missing or unavailable, while the prerendered HTML still contains enough catalog data to render the route.

**How to apply:** Expose loading and error state as fatal only when no catalog data exists, and let category/product pages use their catalog-derived fallback metadata when optional SEO requests fail.

Public category aliases and noindex utility routes need their own build-time metadata entries; an SPA fallback otherwise serves the homepage title in raw HTML even when React later corrects it.

**Why:** Search engines and link previews read the first HTML response before client JavaScript runs, so client-only title effects cannot repair a generic fallback document.

**How to apply:** Keep alias metadata backed by the same category SEO response used by the client, generate files for `/search`, `/compare`, `/cart`, `/checkout`, and `/orders`, and keep their noindex status explicit.