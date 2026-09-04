# CABL — متجر منتجات Vention الأصلية في اليمن

A Vention charging-accessories storefront for CABL, using the existing Namshi-style editorial layout.

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

## Architecture decisions

- Customer order requests and newsletter subscriptions are persisted in PostgreSQL without requiring visitor authentication; favorites remain browser-local.
- Prices are shown directly on products and the storefront is written for customers buying from CABL, not for presenting a wholesale proposal.
- Product imagery is local to the artifact rather than hotlinked, so the storefront remains previewable and portable.

## Product

The CABL homepage presents ten Vention products across power banks, GaN chargers, cables, and travel adapters. Customers can search and filter products, open a detailed product preview, save favorites, add products to the cart, submit an order request, and subscribe to updates.

## User preferences

Use the supplied Vention catalog as the source of truth. Keep the customer experience focused on products, pricing, ordering, delivery, and support from CABL.

## Gotchas

- The active app is registered at `/` and must be run through the managed `artifacts/namshi-store: web` workflow.
- Images resolve through `import.meta.env.BASE_URL`, which keeps the app working behind the artifact route.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
