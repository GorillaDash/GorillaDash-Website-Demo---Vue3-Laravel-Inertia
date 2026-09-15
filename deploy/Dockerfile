# syntax=docker/dockerfile:1.7
#
# Multi-stage build producing TWO runtime images from a single source build,
# selected with `--target`:
#
#   --target web   FrankenPHP image that serves the Laravel/Inertia app over HTTP
#   --target ssr   Node image that runs the Inertia SSR renderer (bootstrap/ssr/ssr.js)
#
# Both are tagged with the SAME git SHA and deployed together in one pod
# (sidecar pattern), so the SSR bundle and the PHP code can never drift apart.
#
# Build context = repository root. Build from there with:
#   docker build -f deploy/Dockerfile --target web -t <repo>/web:<sha> .
#   docker build -f deploy/Dockerfile --target ssr -t <repo>/ssr:<sha> .
#
# Base images use MOVING tags on purpose. Digest pins were tried on the client build
# this starter was extracted from and reverted: the rationale was that upstream
# retags were causing BuildKit cache misses on the `web` stage (8s when --cache-from
# hits, 41s when it misses), and that turned out to be unsupported. On 2026-08-04,
# when both misses were observed, none of these tags had been retagged (Docker Hub
# last_updated was 07-29 / 08-02), and the built images' base layers were
# byte-identical across a hit and a miss. The misses correlate with slow PUSH on the
# same build, which points at registry I/O on that Cloud Build worker, not at the
# base image.
#
# Pinning therefore bought no measured speed while making upgrades manual. If you pin
# these again, do it for supply-chain reproducibility and say so — not for build time.

###############################################################################
# Stage: builder — has PHP 8.3 (for composer + wayfinder) AND Node 22 (for Vite)
###############################################################################
FROM dunglas/frankenphp:1-php8.3 AS builder

WORKDIR /app

# Node 22 + corepack/pnpm, copied from the official node image (same Debian
# bookworm base as frankenphp, so the binaries are ABI-compatible).
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -sf /usr/local/lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack \
 && corepack enable && corepack prepare pnpm@11.9.0 --activate

# Composer + the tooling it needs to extract dist packages (the base PHP has no
# zip extension, and there's no unzip/git in the slim image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN install-php-extensions zip \
 && apt-get update \
 && apt-get install -y --no-install-recommends git unzip \
 && rm -rf /var/lib/apt/lists/*

# --- PHP dependencies (no dev) ---
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --no-autoloader

# --- JS dependencies (with dev — Vite/build tooling lives in devDependencies) ---
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# --- App source + build ---
COPY . .

# A throwaway env + sqlite file so framework boots during the build never touch
# a real database. `composer dump-autoload` triggers `package:discover`, and the
# Wayfinder Vite plugin runs `php artisan wayfinder:generate` — both boot Laravel,
# so the env must be in place first.
#
# IMPORTANT: this `.env.example` is ALSO what Vite reads for `VITE_*` vars — they
# get inlined into the JS bundle here, at build time. The per-country k8s
# `config.env`/ConfigMap is runtime-only and a compiled SPA never reads it, so a
# `VITE_*` value (e.g. VITE_GCS_STATIC_URL) only takes effect if it's set in
# `.env.example`. Per-country VITE values aren't possible with this one-image
# build — expose those as a runtime Inertia shared prop instead (see the
# `config` bag in HandleInertiaRequests, read via resources/ts/runtimeConfig).
RUN cp .env.example .env \
 && touch database/database.sqlite \
 && composer dump-autoload --optimize --no-dev \
 && php artisan key:generate --no-interaction --force

# Builds public/build (client) AND bootstrap/ssr/ssr.js (SSR bundle).
# REMINDER: the SSR bundle is named after the Vite SSR entry's basename
# (resources/ts/ssr.ts → ssr.js). If you re-point that entry, update the ssr
# stage's CMD below to match, or the ssr container CrashLoops (MODULE_NOT_FOUND).
RUN pnpm run build:ssr

###############################################################################
# Stage: web — FrankenPHP serving the Laravel app over HTTP on :8080
###############################################################################
FROM dunglas/frankenphp:1-php8.3 AS web

WORKDIR /app

# Production PHP extensions. Adjust DB driver to match your Cloud SQL engine
# (pdo_mysql for MySQL, pdo_pgsql for PostgreSQL). Redis is optional.
# Also disable expose_php so the exact PHP version isn't leaked via the
# X-Powered-By response header (info disclosure hardening). The companion
# `Server: …Caddy` leak never reaches a visitor either: Cloudflare replaces the
# header with its own on every proxied response.
RUN install-php-extensions pdo_mysql pdo_pgsql opcache pcntl redis \
 && echo 'expose_php = Off' > "${PHP_INI_DIR}/conf.d/zz-hardening.ini"

# App source (node_modules/vendor/.env excluded via .dockerignore) ...
COPY . .
# ... overlaid with the built PHP autoloader + compiled assets from the builder.
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/public/build ./public/build

COPY deploy/docker/web-entrypoint.sh /usr/local/bin/web-entrypoint

# Octane drives FrankenPHP via its OWN generated Caddyfile (worker directive +
# `encode zstd br gzip`), so no custom Caddyfile is copied in. The worker
# bootstrap (public/frankenphp-worker.php) is normally auto-created at runtime by
# `octane:frankenphp`, but it's .gitignored (absent from a fresh CI checkout) so
# we bake it in here to be deterministic regardless of runtime user/permissions.
# XDG_*_HOME point Caddy's config/data at a writable path under storage/.
RUN chmod +x /usr/local/bin/web-entrypoint \
 && mkdir -p storage/framework/{cache,sessions,views,octane} bootstrap/cache \
 && cp vendor/laravel/octane/src/Commands/stubs/frankenphp-worker.php public/frankenphp-worker.php \
 && chown -R www-data:www-data storage bootstrap/cache \
 && rm -f .env

ENV XDG_CONFIG_HOME=/app/storage/framework/octane \
    XDG_DATA_HOME=/app/storage/framework/octane

# FrankenPHP listens on :8080 (plain HTTP; TLS is terminated at the GKE Ingress).
EXPOSE 8080

ENTRYPOINT ["web-entrypoint"]
# Laravel Octane on FrankenPHP worker mode: boots the app ONCE and keeps it in
# memory, so each request skips the framework bootstrap (~50-150ms + much less
# CPU/request than the old classic `php_server` mode). No --https: TLS is
# terminated at the GKE Ingress, so we serve plain HTTP.
#
# --workers=4 on a 1-CPU container is intentional: the web tier spends most of
# each request *waiting* on the SSR sidecar (blocking HTTP to :13714), so >1
# worker per core lets several requests be in-flight against SSR while the CPU is
# idle. Each worker holds a booted app (~40-60MB), so --workers and the memory
# limit (deployment.yaml) must scale together. NEVER use --workers=auto: it
# counts the NODE's cores, not this container's CPU limit, and would over-spawn
# and OOM (same trap as the SSR cluster note in deployment.yaml).
CMD ["php", "artisan", "octane:frankenphp", \
     "--host=0.0.0.0", "--port=8080", "--admin-port=2019", \
     "--workers=4", "--max-requests=500"]

###############################################################################
# Stage: ssr — Node 22 running the Inertia SSR renderer on :13714
###############################################################################
FROM node:22-bookworm-slim AS ssr

WORKDIR /app
ENV NODE_ENV=production

# Only the runtime deps the SSR bundle imports (vue, @inertiajs/vue3) — these
# live in "dependencies", so --prod is enough. package.json carries
# "type": "module", so Node runs the bundle as ESM.
#
# --ignore-scripts is required: the root `prepare` script runs `husky`, but husky
# is a devDependency that a --prod install omits, so without this the install dies
# with `husky: not found`. The SSR runtime is a pre-bundled file and needs no
# lifecycle scripts, so skipping them is safe.
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=builder /app/bootstrap/ssr ./bootstrap/ssr

EXPOSE 13714
# Functionally identical to `php artisan inertia:start-ssr`, without needing PHP
# in this image. createServer() in the bundle binds 0.0.0.0:13714.
# The bundle is named after the Vite SSR entry (resources/ts/ssr.ts → ssr.js).
CMD ["node", "bootstrap/ssr/ssr.js"]
