---
name: API validation version
description: Orval's current Zod generator emits Zod 4-only helpers while this workspace uses Zod 3.
---

Keep the generated API validation compatible with the workspace's installed Zod version. When adding OpenAPI schemas, prefer constraints that generate shared-compatible validators (for example numeric bounds and regex patterns) unless the package version is intentionally upgraded.

**Why:** Code generation can succeed while the generated validators fail the workspace typecheck if the spec causes Orval to emit helpers unavailable in the installed Zod runtime.

**How to apply:** After every OpenAPI change, run codegen and the library typecheck before wiring new routes or client calls. Keep the generated Zod barrel explicit when a generated params type collides with the API module; normalize the barrel after Orval runs.