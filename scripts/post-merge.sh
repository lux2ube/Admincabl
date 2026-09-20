#!/usr/bin/env bash
set -Eeuo pipefail

pnpm install --frozen-lockfile --prefer-offline

# Database schema pushes are intentionally opt-in. The post-merge hook runs
# after unrelated task merges too, and a transient/unavailable database must
# not block code setup indefinitely or mutate a database without an explicit
# request.
if [[ "${POST_MERGE_PUSH_DB:-0}" != "1" ]]; then
  echo "Skipping database schema push (set POST_MERGE_PUSH_DB=1 to run it explicitly)."
  exit 0
fi

echo "Pushing database schema with a 90-second timeout..."
timeout --foreground --signal=TERM --kill-after=10s 90s \
  pnpm --filter db push
