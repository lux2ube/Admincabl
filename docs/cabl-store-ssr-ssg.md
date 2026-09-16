# CABL storefront hybrid SSR/SSG report

## Current flow

The API remains the canonical source for the published catalog, prices, stock,
shipping options, specifications, and SEO records. The storefront build calls
the catalog and SEO endpoints, then writes route-level HTML for the public
catalog, category, brand, product, guide, and location paths.

Each generated page contains:

- Crawlable headings, descriptions, product details, prices, availability,
  images, links, and related products.
- Canonical, Open Graph, robots, breadcrumb, product, and page JSON-LD.
- An escaped `application/json` payload with the canonical `/store/catalog`
  response.

The static host keeps directory-index routes ahead of the SPA fallback, while
interactive-only routes such as search, cart, checkout, and order lookup use
the client entry point.

## Client handoff

`StoreProvider` validates and uses the embedded catalog as React Query
`initialData`. This removes the initial catalog request on generated pages while
retaining a bounded freshness window for later refreshes. The existing
`createRoot` bootstrap intentionally remains in place.

The generated SEO body is custom crawlable markup and is not the same tree as
the interactive React application. Using `hydrateRoot` here would create
structural mismatches. The production-safe handoff is therefore:

1. Serve useful HTML without JavaScript.
2. Start React with the embedded catalog already available.
3. Replace the static shell with the interactive application.

Converting this to true React hydration requires making the prerenderer render
the same route tree and component markup as the client first; it should not be
introduced by changing only the bootstrap call.

## Verification

Successful checks for this change:

- CABL typecheck.
- Production build with `PORT` and `BASE_PATH`.
- 110 generated public routes.
- SEO acceptance across 7 representative routes and 58 product pages.
- Raw HTML checks for H1, canonical, JSON-LD, product data, and catalog payload.
- Static server checks for 200, 404, and trailing-slash 308 behavior.
- `robots.txt` and API sitemap responses.
- Production-browser smoke test on a generated page:
  - no initial `/api/store/catalog` request;
  - 17 home product cards rendered;
  - add-to-cart rendered the floating cart summary;
  - live search returned 6 results;
  - mobile viewport had no horizontal overflow.

## Constraints

- The catalog payload is repeated in each generated page, currently about
  146 KB before compression. This avoids a blocking catalog request but should
  be revisited if the published catalog grows substantially.
- The build requires the API server and database-backed catalog to be
  available. Missing catalog data fails the build instead of shipping generic
  SEO HTML.
- The separate API SEO request remains useful for client-side metadata updates
  after navigation; the first raw response already contains the static metadata.