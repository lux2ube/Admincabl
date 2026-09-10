---
name: Static SEO routes
description: Serving crawlable directory-based SEO pages alongside the root Vite SPA.
---

Clean SEO paths such as `/chargers/` must resolve to their own generated `index.html`, not the SPA shell. A catch-all production rewrite and Vite's default SPA fallback can both hide those pages.

**Why:** Search engines need the category title, description, headings, and structured data in the initial HTML response; client-side route rendering is not an equivalent fallback for this storefront.

**How to apply:** When adding static SEO pages under a Vite public directory, keep the static server ahead of any SPA fallback. In development, rewrite only known directory paths that contain a public `index.html`; do not intercept the root app or API paths.

The Vite SPA entry should not contain a root-relative canonical URL such as `/` or `./`; Vite can treat it as a directory asset during production builds. Let the app's runtime SEO effect create the home canonical, while generated static SEO pages emit explicit route canonicals.

**Why:** Vite's HTML asset transform can fail the production build with `EISDIR` when it resolves the root canonical reference as a directory.

**How to apply:** Keep canonical tags explicit in generated public route pages. For the SPA entry, create or update the canonical link after the page route and SEO response are known.