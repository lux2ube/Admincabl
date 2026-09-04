# القراحي الكترونيك — Vention Yemen

A Vention charging-accessories storefront for القراحي الكترونيك, the exclusive Vention agent in Yemen, using the existing Namshi-style editorial layout.

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

- `artifacts/namshi-store/src/App.tsx` — active القراحي الكترونيك electronics catalog, filters, and quote-shortlist interactions
- `artifacts/namshi-store/src/index.css` — editorial storefront design system and responsive styles
- `artifacts/namshi-store/public/images/` — local Vention product and campaign media
- `artifacts/waslah-store/` — standalone Arabic RTL version of the same Vention shortlist
- `artifacts/namshi-store/.replit-artifact/artifact.toml` — active artifact routing metadata

## Architecture decisions

- The initial experience is frontend-only so the shortlist can be reviewed without authentication or a database.
- Retail prices are shown only as reference values; wholesale pricing is intentionally not invented and the primary action is a quotation request.
- Product imagery is local to the artifact rather than hotlinked, so the storefront remains previewable and portable.

## Product

The القراحي الكترونيك homepage presents the ten-product Vention shortlist across power banks, GaN chargers, cables, and travel adapters. Visitors can search and filter products, review SKUs and retail references, and build a quote shortlist for Yemen sourcing.

## User preferences

Use the supplied Vention shortlist as the source of truth. Keep retail references distinct from the eventual wholesale price list and do not treat the current retail figures as purchase costs.

## Gotchas

- The active app is registered at `/` and must be run through the managed `artifacts/namshi-store: web` workflow.
- Images resolve through `import.meta.env.BASE_URL`, which keeps the app working behind the artifact route.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
