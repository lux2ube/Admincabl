---
name: Supabase data migration
description: Safe data transfer from the legacy PostgreSQL database into the Supabase-backed schema.
---

When moving this project's existing PostgreSQL data into Supabase, use the Supabase PostgreSQL connection as the application and Drizzle target, and export legacy rows with column-qualified `INSERT` statements rather than positional inserts.

**Why:** The legacy database and the freshly pushed Supabase schema can expose the same columns in different physical orders. Positional dump inserts can then fail or, worse, target the wrong types. psql-only dump directives also cannot be sent through a Node `pg` query.

**How to apply:** Prefer `SUPABASE_DATABASE_URL` over the runtime-managed fallback, apply the schema first, export source data with `pg_dump --column-inserts`, remove only psql meta-commands when importing through Node, use one transaction, and compare source/target counts plus a real API read afterward.