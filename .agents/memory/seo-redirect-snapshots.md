---
name: SEO redirect snapshots
description: The invariant needed when recording legacy catalog URLs during slug changes
---

When a catalog slug changes, derive the old canonical URL from the pre-update slug before reading the updated row; querying the row after mutation only exposes the new slug and silently produces no redirect.

**Why:** Product canonical URLs depend on related brand and category slugs, so reconstructing the old path after the update can make it identical to the new path.

**How to apply:** Capture the old entity state or old URL before the database mutation, then persist the redirect after the update and verify it through the public SEO lookup.

Legacy catalog redirects must preserve both the mounted storefront form and the root-relative public form used by older links.

**Why:** The storefront is served under an artifact mount, but catalog URLs can also be shared without that mount; keeping only one form makes renamed brand, category, or product links environment-dependent.

**How to apply:** Write compatibility redirects for both forms, and make SEO lookup accept either form before resolving the final target slug.