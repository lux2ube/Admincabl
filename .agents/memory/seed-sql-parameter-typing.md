---
name: Seed SQL parameter typing
description: PostgreSQL parameter inference in the catalog seed statements
---

When a seed query reuses one parameter both as an inserted varchar value and inside a subquery comparison, cast it explicitly to `varchar` in both positions.

**Why:** PostgreSQL can infer the same placeholder as `text` in one context and `character varying` in another, causing the seed transaction to fail at runtime even though TypeScript compilation succeeds.

**How to apply:** Use explicit SQL casts in new multi-purpose seed parameters, then run the live admin seed endpoint after typechecking.