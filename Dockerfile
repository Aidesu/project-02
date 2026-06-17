# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
#  Multi-stage build for the Next.js (standalone) app.
#
#  Stages:
#    base    – shared Node base image
#    deps    – full dependency install (cached on package*.json)
#    builder – `next build` → .next/standalone, and bundles the DB bootstrap
#              (scripts/db-init.ts) into a single self-contained dist/db-init.mjs
#    runner  – minimal production image: standalone server + the bundled
#              migrate/seed step. Runs as non-root and self-migrates on boot
#              (see docker-entrypoint.sh), so one image is all you deploy.
# ─────────────────────────────────────────────────────────────────────────────

# node:24 (Debian/glibc) on purpose:
#  - matches the dev runtime (Node 24 / npm 11). npm 11 wrote package-lock.json;
#    npm 10 (shipped by node:22) mishandles the nested cross-platform esbuild
#    optional deps and trips EBADPLATFORM on `npm ci`.
#  - glibc sidesteps Alpine/musl edge cases in pg / gamedig.
FROM node:24-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: install all dependencies (incl. dev — needed to build & to migrate)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the standalone server -------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Bundle migrate + seed-if-empty into one ESM file. drizzle-orm is inlined;
# only `pg` stays external (it ships in the standalone node_modules already).
RUN node_modules/.bin/esbuild scripts/db-init.ts \
      --bundle --platform=node --format=esm --target=node24 \
      --external:pg --outfile=dist/db-init.mjs

# ---- runner: lean runtime image -------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# `output: "standalone"` does not copy public/ or .next/static — do it by hand.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrate/seed bundle + the SQL migrations it applies, and the boot wrapper.
COPY --from=builder --chown=nextjs:nodejs /app/dist/db-init.mjs ./dist/db-init.mjs
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/migrations ./lib/db/migrations
COPY docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# Applies migrations + seeds an empty DB, then execs `node server.js`.
# Honours PORT / HOSTNAME from the env.
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
