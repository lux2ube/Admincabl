---
name: Single Vercel deployment
description: CABL's one-domain Vercel deployment architecture for the monorepo.
---

The production Vercel project should use the repository root as its Root Directory. Its build assembles the storefront output, copies the admin static app under `/admin/`, and packages the Express API under `/api/*` from the same deployment.

**Why:** Separate Vercel projects created an unavailable API origin and made the storefront dependent on a second deployment being correctly assigned and configured.

**How to apply:** Keep the root build command and root `vercel.json` as the source of truth. Configure production database and session variables in Vercel, leave the frontend API origin relative, and verify `/`, `/admin/`, `/api/healthz`, and `/api/store/catalog` on the same domain.