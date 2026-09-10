---
name: CairoVolt data boundary
description: The CairoVolt-inspired storefront must use the project's own database for commerce data while keeping reference assets local.
---

Reference-site visuals are presentation assets only. Product names, prices, discounts, images configured in the catalog, inventory, currencies, shipping, payment methods, customers, and orders must come from the project's own PostgreSQL-backed API.

**Why:** This preserves the user's data ownership and prevents reference-site prices, availability, or checkout promises from leaking into live commerce behavior.

**How to apply:** Keep CairoVolt branding and local visual assets in the web artifact, but make product cards, hero price data, product details, cart totals, checkout validation, and order tracking read from the database/API. Do not invent reference-site governorates, prices, shipping thresholds, payment promises, or contact settings when the current schema does not provide them; show a generic database-backed option or add an explicit settings model first.