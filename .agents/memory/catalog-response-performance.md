---
name: Catalog response performance
description: Performance boundary for the CABL catalog endpoint when the storefront loads all published products.
---

The full published catalog is small enough to load as one response; the dominant delay is database round trips and repeated concurrent requests, not the product count or JSON size. Use a short freshness window and deduplicate in-flight catalog builds.

**Why:** The catalog response is around hundreds of kilobytes or less, while uncached database assembly can take several seconds in the hosted environment. Repeating that work makes navigation feel slow without improving the user-visible data.

**How to apply:** Keep the cache window short enough for prices and stock to refresh promptly, and preserve the same response shape and validation path for cached and uncached results.