#!/usr/bin/env bash
#
# Rename the Acme placeholder brand to a real client, in place.
#
#   bin/new-client.sh --slug great-burger --name "Great Burger" [--domain greatburger.com]
#
#   --slug    kebab-case machine name: k8s names/namespaces, image repo, GCS
#             prefix (camelCased), edge token name. Lowercase a-z and dashes.
#   --name    Display name: APP_NAME, page titles, UI copy.
#   --domain  Production apex domain (optional). Replaces acme-usa.example.com;
#             skip it to keep the placeholder and set domains later.
#
# Idempotent-ish: running it twice is a no-op (the placeholders are gone).
# After it runs, work through docs/NEW-CLIENT-CHECKLIST.md — GD/Tolgee/GCP/
# Cloudflare values are per-client and cannot be scripted from here.

set -euo pipefail

SLUG='' NAME='' DOMAIN=''
while [ $# -gt 0 ]; do
  case "$1" in
    --slug) SLUG="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
[ -n "$SLUG" ] && [ -n "$NAME" ] || { echo "Usage: $0 --slug <kebab-slug> --name \"<Display Name>\" [--domain <apex>]" >&2; exit 1; }
case "$SLUG" in
  *[!a-z0-9-]*) echo "--slug must be lowercase kebab-case (a-z, 0-9, -)" >&2; exit 1 ;;
esac
# The templates append the country themselves ("Acme Diner" -> "Acme Diner USA"), so a
# --name that already ends in one produces "Graze Craze USA USA" in every APP_NAME and
# page title. That happened once and was only caught after the site was deployed.
case "$NAME" in
  *\ USA|*\ US|*\ AU|*\ NZ|*\ UK|*\ CA|*\ IE|*\ ZA|*\ SG|*\ IN)
    echo "--name ends in a country ('$NAME'). The templates append the country, so this" >&2
    echo "would render as '$NAME USA'. Pass the brand alone, e.g. --name \"${NAME% *}\"." >&2
    echo "Override with FORCE_NAME=1 if the country really is part of the brand." >&2
    [ "${FORCE_NAME:-}" = "1" ] || exit 1 ;;
esac

cd "$(dirname "$0")/.."

# GCS prefix convention: camelCase slug + trailing underscore (great-burger -> greatBurger_).
CAMEL=$(printf '%s' "$SLUG" | perl -pe 's/-(\w)/\u$1/g')

# /usr/bin/grep on purpose: a PATH grep may be ugrep, whose -Z/--null differs.
#
# Every option goes BEFORE the `--`. BSD grep (macOS) stops parsing options at
# `--`, so a trailing --null/--exclude-dir is silently taken as a FILE operand:
# the excludes are ignored and, worse, the file list comes back newline- rather
# than NUL-separated, so `xargs -0` hands perl one giant bogus filename and the
# whole rename no-ops (stderr is swallowed, so it looks like it worked).
#
# bin/ is excluded on purpose: these scripts are written in terms of the
# placeholder, and rewriting this file while bash is still reading it corrupts
# the run.
GREP_ARGS=(--null --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=vendor
  --exclude-dir=bin --exclude=pnpm-lock.yaml --exclude=composer.lock)
#
# Both strings travel via the environment, so nothing from the command line is
# interpolated into perl source. \Q..\E belongs on the PATTERN side only: on the
# replacement side it doesn't "quote", it inserts literal backslashes — which is
# how `--slug a-b` used to produce `a\-b` (an invalid k8s name).
replace() {
  local from="$1" to="$2"
  /usr/bin/grep -rIlF "${GREP_ARGS[@]}" -- "$from" . 2>/dev/null |
    FROM="$from" TO="$to" xargs -0 perl -pi -e 'BEGIN{$f=$ENV{FROM}; $t=$ENV{TO}} s/\Q$f\E/$t/g' 2>/dev/null || true
}

# Longest / most specific first.
if [ -n "$DOMAIN" ]; then
  replace 'www.acme-usa.example.com' "www.${DOMAIN}"
  replace 'acme-usa.example.com' "${DOMAIN}"
  replace 'acme-au.example.com' "au.${DOMAIN}"
fi
replace 'Acme Diner USA' "${NAME} USA"
replace 'Acme Diner' "${NAME}"
replace 'acme_usa_k8s' "$(printf '%s' "$SLUG" | tr '-' '_')_usa_k8s"
replace 'acme_' "${CAMEL}_"
replace 'acme-cloudflare-api-token' "${SLUG}-cloudflare-api-token"
replace 'acme-usa' "${SLUG}-usa"
replace 'acme-secret' "${SLUG}-secret"
replace 'acme-config' "${SLUG}-config"
# Bare words. \b keeps unrelated words (e.g. "acmeXyz", already handled above)
# intact. Capitalised "Acme" on its own is UI copy and prose ("Acme Favorite",
# "the Acme services"); lowercase is the slug (Makefile REPO, k8s labels/names,
# KSA, DB names). Both run AFTER the "Acme Diner" passes above.
/usr/bin/grep -rIlwF "${GREP_ARGS[@]}" -- 'Acme' . 2>/dev/null |
  NAME="$NAME" xargs -0 perl -pi -e 'BEGIN{$n=$ENV{NAME}} s/\bAcme\b/$n/g' 2>/dev/null || true
/usr/bin/grep -rIlwF "${GREP_ARGS[@]}" -- 'acme' . 2>/dev/null |
  xargs -0 perl -pi -e "s/\bacme\b/${SLUG}/g" 2>/dev/null || true

echo "Renamed: Acme Diner -> ${NAME}, acme -> ${SLUG}, GCS prefix ${CAMEL}_"
# `|| true`: a clean rename means zero matches, and grep exits 1 on no-match —
# which under `set -e` would abort the script right before its own summary.
LEFT=$({ /usr/bin/grep -rIliE "${GREP_ARGS[@]}" -- 'acme' . 2>/dev/null || true; } | tr '\0' '\n' | wc -l | tr -d ' ')
echo "Files still mentioning acme (should be 0): ${LEFT}"
echo
# The slug is silently load-bearing: it names the namespace, the image repo and the
# static-IP name, and nothing downstream ever questions it. A client site once went
# live under the PREVIOUS client's slug because nobody read it back. Print what this
# run actually baked in, so a wrong --slug is caught here instead of in a cluster.
cat <<SUMMARY
Check these read as this client — the slug cannot be changed once resources exist:

  display name    ${NAME}
  APP_NAME        ${NAME} USA
  slug            ${SLUG}
  namespace       ${SLUG}-usa
  image repo      ${SLUG}
  static IP       ${SLUG}-usa-ip   (Makefile IP_NAME)
  k8s Secret      ${SLUG}-secret
  GCS prefix      ${CAMEL}_
  database        $(printf '%s' "$SLUG" | tr '-' '_')_usa_k8s

SUMMARY
echo "Next: docs/NEW-CLIENT-CHECKLIST.md (GD ids, Tolgee, GCP, Cloudflare, fonts, images)."
