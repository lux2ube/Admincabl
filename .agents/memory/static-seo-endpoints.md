---
name: Static SEO endpoints
description: Serving robots.txt and sitemap.xml from a mounted static storefront artifact.
---

For a mounted static storefront, generating `robots.txt` and `sitemap.xml` in the production directory is only half of the fix. Register the mounted paths and root SEO paths in the artifact routing configuration, and make the local static server serve both forms from the same files.

**Why:** Crawlers commonly request `/robots.txt` and `/sitemap.xml` at the site root. If those paths are not claimed by the static artifact, the request can fall through to a backend or generic “Backend Not Configured” response even when the files exist under the storefront mount.

**How to apply:** Generate both files from the final canonical route map, point robots to the mounted static sitemap, and verify root plus mounted paths with status, content, and no-backend-route assertions.