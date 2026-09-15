---
name: Static catalog handoff
description: The boundary between CABL prerendered SEO HTML and the interactive React storefront.
---

CABL's prerendered route HTML is deliberately custom crawlable markup, not the output of the interactive React tree. The browser should therefore replace that shell with `createRoot` and seed React Query from the escaped catalog JSON payload embedded in the page; do not switch this path to `hydrateRoot` without first making the server markup identical to the React tree.

**Why:** Hydrating the current SEO shell would create structural mismatches, while a build-time catalog payload removes the initial catalog round trip without sacrificing the no-JavaScript HTML.

**How to apply:** Keep the payload shape aligned with the `/store/catalog` response, validate its required top-level arrays before use, and retain a bounded freshness window so later catalog changes can still refresh the client cache.