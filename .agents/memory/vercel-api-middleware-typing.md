---
name: Vercel API middleware typing
description: TypeScript compatibility for the Express serverless bundle deployed from Vercel.
---

Express middleware that combines Pino HTTP serializers with Express 5 types must use explicit `Request` and `Response` callback types and an explicit `RequestHandler` boundary. Local workspace typechecking can accept the inferred version while Vercel's TypeScript check reports TS2345 and TS7006.

**Why:** Vercel may typecheck the serverless entry with a stricter or differently resolved dependency graph than the local pnpm workspace.

**How to apply:** Keep the serverless build type-safe with explicit middleware types; do not solve this class of failure by disabling TypeScript checks or removing the request logger.