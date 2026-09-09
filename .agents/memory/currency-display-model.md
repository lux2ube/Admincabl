---
name: Currency display model
description: The storefront currency switcher and the relationship between display prices and stored order values.
---

The CABL catalog and order calculations use USD as the canonical internal amount. Active database currencies store units per USD, and the storefront converts those amounts only for presentation; the default display currency is YER.

**Why:** Existing product prices, shipping rules, coupons, and order line items are USD-based. Converting those records in place would change historical meaning and risk inconsistent order totals.

**How to apply:** If fixed-currency invoices, receipts, refunds, or admin order displays become a requirement, add a currency code and rate snapshot to orders before changing server-side settlement calculations.