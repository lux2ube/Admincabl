---
name: SEO redirect snapshots
description: The invariant needed when recording legacy catalog URLs during slug changes
---

When a catalog slug changes, derive the old canonical URL from the pre-update slug before reading the updated row; querying the row after mutation only exposes the new slug and silently produces no redirect.

**Why:** Product canonical URLs depend on related brand and category slugs, so reconstructing the old path after the update can make it identical to the new path.

**How to apply:** Capture the old entity state or old URL before the database mutation, then persist the redirect after the update and verify it through the public SEO lookup.