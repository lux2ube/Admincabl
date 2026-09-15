---
name: WebMCP availability
description: Browser support and safety expectations for WebMCP integrations in the storefront.
---

WebMCP is an experimental browser API and may be absent in normal preview browsers. Storefront integrations must feature-detect `document.modelContext`, register tools only when available, and unregister them through an abort signal.

**Why:** The page must remain a normal working storefront when the browser has no WebMCP implementation, while agents still need clear, bounded tools where the API exists.

**How to apply:** Prefer read-only catalog discovery tools. Do not expose customer/order data or silently perform checkout mutations through an agent tool.