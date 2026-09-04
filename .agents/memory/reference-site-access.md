---
name: Reference-site access
description: Live-site extraction can be unavailable in this workspace; clones should remain portable without remote media dependencies.
---

When a reference site cannot be fetched reliably, keep the build self-contained with local assets and editable data rather than hotlinking the source.

**Why:** The reference host may reject automated requests or be unreachable from the build environment, while the resulting storefront still needs to render consistently in previews and deployments.

**How to apply:** Treat the supplied URL as visual/structural direction, preserve a clean local asset boundary, and make branding/catalog data easy to replace before publishing.