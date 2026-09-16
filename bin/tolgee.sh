#!/usr/bin/env sh
#
# Runs the Tolgee CLI with the API key taken from the gitignored .env.
#
# The key used to sit in .tolgeerc, which is a TRACKED file — so it was published
# the moment this repository was made public. It must never go back there. This
# wrapper is the supported way to run the CLI: the credential stays in .env (or
# .env.local.shared, which `php artisan env:use` composes into .env) and is handed
# to the CLI as an environment variable for the life of one command.
#
#   pnpm run tolgee -- sync --yes
#   pnpm run tolgee -- pull
#
set -e

if [ ! -f .env ]; then
  echo "bin/tolgee.sh: no .env in $(pwd). Run 'composer setup' first." >&2
  exit 1
fi

KEY=$(grep -E '^TOLGEE_API_KEY=' .env | tail -n 1 | cut -d= -f2- | tr -d "\"'")

if [ -z "$KEY" ]; then
  echo "bin/tolgee.sh: TOLGEE_API_KEY is empty in .env — put your Tolgee" >&2
  echo "personal access token there (or in .env.local.shared), not in .tolgeerc." >&2
  exit 1
fi

TOLGEE_API_KEY="$KEY" exec npx --yes @tolgee/cli "$@"
