#!/bin/sh
set -e

# Compile config/routes/views using the runtime environment injected by
# Kubernetes (APP_KEY, DB_*, INERTIA_SSR_* from the ConfigMap/Secret). This runs
# on every container start because the env is only known at runtime, not build.
php artisan config:cache
php artisan route:cache
php artisan view:cache

# NOTE: database migrations are intentionally NOT run here — with multiple
# replicas that would race. They run once per release via the migrate Job
# (deploy/k8s/migrate-job.yaml).

exec "$@"
