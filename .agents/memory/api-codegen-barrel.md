---
name: API codegen barrel exports
description: Keep Orval-generated API types reachable from the public api-zod package after adding OpenAPI schemas.
---

After adding OpenAPI schemas and running Orval, verify that every generated type needed by server code is exported from the `api-zod` public barrel. The generator may create the files without adding all type exports to the package entrypoint.

**Why:** The generated files can exist and codegen can pass while downstream packages still report missing exports when they import the new response types.

**How to apply:** Run API codegen, inspect the public barrel, rebuild `api-zod`, then typecheck the API server before wiring routes.