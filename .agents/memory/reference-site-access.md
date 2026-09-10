---
name: Reference-site access
description: Live-site extraction can be unavailable in this workspace; clones should remain portable without remote media dependencies.
---

When a reference site cannot be fetched reliably, keep the build self-contained with local assets and editable data rather than hotlinking the source.

**Why:** The reference host may reject automated requests or be unreachable from the build environment, while the resulting storefront still needs to render consistently in previews and deployments.

**How to apply:** Treat the supplied URL as visual/structural direction, preserve a clean local asset boundary, and make branding/catalog data easy to replace before publishing.

For authorized Next.js storefront clones, a saved server-rendered HTML response plus a browser screenshot is a valid fallback when Playwright is unavailable; download referenced fonts and media into the artifact before coding.

**Why:** The live page can be visually accessible while the automation package is missing, and remote asset dependencies make the resulting clone fragile.

**How to apply:** Save the raw response as the extraction source, keep the source screenshot for comparison, and use hashed local assets rather than hotlinking the reference host.