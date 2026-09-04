# Waslah Tech Store

An Arabic-first sourcing storefront for a focused Vention charging-accessories shortlist, with retail reference pricing and wholesale quote-request flows.

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

- `artifacts/waslah-store/src/App.tsx` — Waslah catalog, filters, comparison, and quote-shortlist interactions
- `artifacts/waslah-store/src/index.css` — RTL storefront design system and responsive styles
- `artifacts/waslah-store/public/images/` — local product and campaign media
- `artifacts/namshi-store/` — earlier reference build retained separately from the active Waslah storefront
- `artifacts/namshi-store/.replit-artifact/artifact.toml` — artifact routing metadata

## Architecture decisions

- The initial Waslah experience is frontend-only so the shortlist can be reviewed without authentication or a database.
- Retail prices are shown only as reference values; wholesale pricing is intentionally not invented and the primary action is a quotation request.
- Product imagery is local to the artifact rather than hotlinked, so the storefront remains previewable and portable.

## Product

The Waslah homepage presents the ten-product Vention shortlist across power banks, GaN chargers, cables, and travel adapters. Visitors can search and filter products, compare selected items, review SKUs and retail references, build a quote shortlist, and see the planned costing chain from wholesale price through shipping, customs, and local selling price.

## User preferences

Use the supplied Vention shortlist as the source of truth. Keep retail references distinct from the eventual wholesale price list and do not treat the current retail figures as purchase costs.

## Gotchas

- The active app is registered at `/waslah/` and must be run through the managed `artifacts/waslah-store: web` workflow.
- Images resolve through `import.meta.env.BASE_URL`, which keeps the app working behind the artifact route.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
