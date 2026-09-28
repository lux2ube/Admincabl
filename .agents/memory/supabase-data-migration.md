---
name: Supabase data migration
description: Safe data transfer from the legacy PostgreSQL database into the Supabase-backed schema.
---

When moving this project's PostgreSQL data into Supabase, use the Supabase connection as the application and Drizzle target. First compare exact row counts, schemas, primary/unique keys, and foreign-key relationships. Match records by natural unique keys when generated IDs differ, remap child foreign keys, insert only records not already represented in Supabase, and verify serial sequences before relying on generated IDs.

**Why:** `pg_stat` row estimates can be stale, and independently generated surrogate IDs can make equivalent source and target records look unrelated. A blind dump can create duplicates, violate foreign keys, or overwrite newer target values. The legacy schema and Supabase can also expose columns in different physical orders. Imported IDs can leave a serial sequence behind occupied rows, and Drizzle may suggest truncating a populated table when adding a unique index.

**How to apply:** Use exact `COUNT(*)` queries rather than `pg_stat` estimates. Preserve Supabase values for conflicting records unless the user explicitly chooses otherwise, and leave the source intact until verification. If rows must be imported, apply schema changes first, use column-qualified inserts (for example, `pg_dump --column-inserts`), remove only psql meta-commands when importing through Node, use one transaction, synchronize sequences safely, then compare counts and test a real API read. Do not accept a truncation prompt as a shortcut; remove an unnecessary unique constraint or use an explicit non-destructive migration after checking existing values.