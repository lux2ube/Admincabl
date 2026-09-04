# Namshi Store Clone

A premium, responsive fashion storefront recreation with browsing, search, wishlist, cart, newsletter, and campaign interactions.

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

- `artifacts/namshi-store/src/App.tsx` — storefront page and interaction state
- `artifacts/namshi-store/src/index.css` — storefront design system and responsive styles
- `artifacts/namshi-store/public/images/` — local campaign and product media
- `artifacts/namshi-store/.replit-artifact/artifact.toml` — artifact routing metadata

## Architecture decisions

- The initial experience is frontend-only so the catalog can be browsed without authentication or a database.
- Product filtering, search, wishlist, cart, and newsletter signup are intentionally local interactions for the first release.
- Campaign and product imagery is local to the artifact rather than hotlinked, so the storefront remains previewable and portable.

## Product

The homepage presents seasonal campaigns, category discovery, curated product cards, service promises, and newsletter signup. Shoppers can search the curated catalog, filter by category, save items, add/remove items from the bag, and move between sections from the navigation.

## User preferences

Use the supplied Namshi page as the visual benchmark while keeping the storefront editable for the user's own or client-approved brand assets and catalog.

## Gotchas

- The app is registered at the root preview path and must be run through the managed `artifacts/namshi-store: web` workflow.
- Images resolve through `import.meta.env.BASE_URL`, which keeps the app working behind the artifact route.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
