---
name: PageSpeed preview versus production
description: PageSpeed audits against the Vite preview measure development tooling and Replit noindex headers rather than the production artifact.
---

The CABL storefront should be evaluated for performance, crawlability, and source maps against its published/static production output, not the development preview URL. The development preview injects Vite/Replit tooling, can report HMR diagnostics, and adds an `x-robots-tag: noindex` header outside the app.

**Why:** Lighthouse reported development websocket/tooling payloads and blocked crawling even though the production static server emitted minified assets, source maps, and `text/html; charset=utf-8`.

**How to apply:** Keep development tooling lean enough for local preview, but use the artifact’s production build/server or a published crawlable URL for final PageSpeed scores.