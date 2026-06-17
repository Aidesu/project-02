#!/bin/sh
# Container boot wrapper: bring the database schema up to date (and seed it on
# first run), then hand off to the Next.js standalone server.
#
# db-init.mjs is idempotent — migrations are tracked, and seeding only happens
# when the catalog is empty. We retry to ride out a database that is still
# starting; if it never comes up we still start the server, which degrades to
# the static catalog (see lib/servers.ts) rather than staying down.
set -e

if [ -n "$DATABASE_URL" ]; then
  attempt=0
  until node dist/db-init.mjs; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 10 ]; then
      echo "[entrypoint] db-init failed after $attempt attempts — starting server with static fallback." >&2
      break
    fi
    echo "[entrypoint] database not ready (attempt $attempt) — retrying in 3s…"
    sleep 3
  done
else
  echo "[entrypoint] DATABASE_URL unset — skipping migrations/seed."
fi

exec node server.js
