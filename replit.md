# CABL — متجر إلكتروني متخصص في الشحن والإكسسوارات في اليمن

A focused CABL charging-accessories storefront with an editorial layout, clear commerce flows, and Arabic-first SEO.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/namshi-store/src/App.tsx` — active CABL customer storefront, product filters, previews, cart, and checkout request
- `artifacts/namshi-store/src/index.css` — editorial storefront design system and responsive styles
- `artifacts/namshi-store/public/images/` — local Vention product and campaign media
- `artifacts/cabl-admin/` — CABL operations dashboard for catalog, customer, order, and shipping data
- `artifacts/namshi-store/.replit-artifact/artifact.toml` — active artifact routing metadata
- `docs/CABL_ECOMMERCE_UX_SEO_STANDARD.md` — mandatory UX, mobile, checkout, trust, performance, and SEO acceptance criteria

## Architecture decisions

- Customer order requests and newsletter subscriptions are persisted in PostgreSQL without requiring visitor authentication; favorites remain browser-local.
- Prices are shown directly on products and the storefront is written for customers buying from CABL, not for presenting a wholesale proposal.
- Product imagery is local to the artifact rather than hotlinked, so the storefront remains previewable and portable.
- CABL uses clean, slug-based public routes and server-generated SEO metadata; search and filter URLs are not indexable by default.
- CABL follows its own commerce standard and must not copy another marketplace's identity or complexity.

## Product

The CABL storefront presents published charging and accessory products from the catalog's canonical brands and categories. Customers can search and filter products, open a slug-based product page, save favorites, add products to the cart, submit an order request, and subscribe to updates.

## User preferences

Use the published catalog and database as the source of truth. Keep the customer experience focused on products, pricing, ordering, delivery, and support from CABL. Treat the CABL Ecommerce UX/SEO Standard as acceptance criteria for every UI or route change.

## Gotchas

- The active app is registered at `/` and must be run through the managed `artifacts/namshi-store: web` workflow.
- Images resolve through `import.meta.env.BASE_URL`, which keeps the app working behind the artifact route.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
