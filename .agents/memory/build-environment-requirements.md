---
name: Build environment requirements
description: Vite package builds in this workspace validate PORT and BASE_PATH even when they do not start a server.
---

The CABL Vite config accepts missing `PORT` and `BASE_PATH` for external static hosts, defaulting to a dev-safe port and root deployment path; Replit still supplies its mounted artifact values.

**Why:** External hosts such as Vercel do not provide Replit's artifact runtime variables during build, while mounted Replit previews still need their configured path.

**How to apply:** Use `PORT` and `BASE_PATH` for Replit-mounted builds; omit them for a root-hosted static build. Set `SEO_PRERENDER_API_URL` when the external host should emit catalog-backed route HTML.