---
name: Supabase SQL execution
description: A connection-parser and error-logging constraint for one-off SQL against the application's Supabase database.
---

Use the application's Node `pg` client for one-off SQL against its configured Supabase connection. Avoid passing that connection URL to `psql` in this workspace, and do not print raw connection errors.

**Why:** The application connects successfully through `pg`, while libpq/`psql` can interpret the same configured URL differently. A failed `psql` connection can include part of a credential in its hostname error.

**How to apply:** Run necessary, authorized data fixes through the existing `pg` dependency using the runtime connection setting without inspecting or printing it. Keep writes transactional and idempotent. Log only safe row counts or sanitized error codes, then verify through an application API read.