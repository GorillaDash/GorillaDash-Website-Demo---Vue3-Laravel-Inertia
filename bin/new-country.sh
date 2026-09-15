#!/usr/bin/env bash
#
# Add a country (market) to an already-renamed client repo.
#
#   bin/new-country.sh --country au [--code AU] [--domain au.example.com]
#                      [--locale en] [--tz Australia/Sydney]
#
#   --country  Overlay dir + namespace suffix + DB name segment. Lowercase
#              a-z0-9-. This is the value you pass as COUNTRY= to make / deploy.sh
#              (the deploy-time identifier — NOT the app-level code).
#   --code     App-level country code: config.env COUNTRY, and the value you add
#              to SupportCountryName. Defaults to --country uppercased when that
#              is 2 letters (au -> AU); required otherwise (usa -> US).
#   --domain   Ingress host + APP_URL. Defaults to the staging convention
#              <slug>-<country>.gorilladashstaging.com; point it at the real apex
#              once DNS + the Cloudflare zone exist.
#   --locales  The languages this market SERVES: comma-separated App\Enums\Locale
#              tags, first one is the default (default: en-US). Writes
#              APP_LOCALES, which drives the /{locale} route prefix, the language
#              switcher and the GD/Tolgee locale argument. APP_LOCALE (Laravel's
#              own lang/ lookups) is derived from the first tag's language subtag
#              — it is NOT what makes the site French.
#   --tz       APP_TIMEZONE (default: UTC)
#
# Copies deploy/k8s/overlays/usa -> overlays/<country>, rewrites the per-country
# values, BLANKS the per-country credentials (so a filled-in USA overlay never
# leaks its GD/Tolgee/Maps/Cloudflare ids into a new market), and registers the
# country in the deploy workflow's dropdown.
#
# Everything needing gcloud / kubectl / Cloudflare auth is PRINTED, not run.
#
# Run bin/new-client.sh FIRST — this copies the USA overlay as-is, so the slug
# must already be the client's.

set -euo pipefail

COUNTRY='' CODE='' DOMAIN='' LOCALES='en-US' TZONE='UTC'
while [ $# -gt 0 ]; do
  case "$1" in
    --country) COUNTRY="$2"; shift 2 ;;
    --code) CODE="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --locales) LOCALES="$2"; shift 2 ;;
    --tz) TZONE="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
[ -n "$COUNTRY" ] || { echo "Usage: $0 --country <dir> [--code <XX>] [--domain <host>] [--locales <tag,tag>] [--tz <zone>]" >&2; exit 1; }
case "$COUNTRY" in
  *[!a-z0-9-]*) echo "--country must be lowercase (a-z, 0-9, -)" >&2; exit 1 ;;
esac
if [ "$COUNTRY" = 'usa' ]; then
  echo "'usa' is the built-in default market — its overlay already exists." >&2
  exit 1
fi
if [ -z "$CODE" ]; then
  if [ ${#COUNTRY} -ne 2 ]; then
    echo "--code is required when --country isn't a 2-letter code (e.g. --country usa --code US)" >&2
    exit 1
  fi
  CODE=$(printf '%s' "$COUNTRY" | tr 'a-z' 'A-Z')
fi

cd "$(dirname "$0")/.."

SRC='deploy/k8s/overlays/usa'
DST="deploy/k8s/overlays/${COUNTRY}"
WF='.github/workflows/deploy.yml'

if [ ! -d "$SRC" ]; then
  echo "Source overlay ${SRC} not found — nothing to copy from." >&2
  exit 1
fi
if [ -e "$DST" ]; then
  echo "${DST} already exists. Delete it first, or pick another --country." >&2
  exit 1
fi

# The slug is whatever bin/new-client.sh wrote into the Makefile's REPO.
SLUG=$(perl -ne 'if (/^REPO\s*\?=\s*(\S+)/) { print $1; exit }' Makefile)
if [ -z "$SLUG" ]; then
  echo "Could not read REPO from Makefile." >&2
  exit 1
fi
if [ "$SLUG" = 'acme' ]; then
  echo "Repo is still the Acme placeholder. Run bin/new-client.sh first." >&2
  exit 1
fi
SNAKE=$(printf '%s' "$SLUG" | tr '-' '_')

# Display name: the overlay convention is "<client> <CODE>" (.env holds the bare
# client name, each overlay appends its market).
BASE_NAME=$(perl -ne 'if (/^APP_NAME=(.*)/) { $v = $1; $v =~ s/^["\x27]|["\x27]$//g; print $v; exit }' .env.example 2>/dev/null || true)
[ -n "$BASE_NAME" ] || BASE_NAME="$SLUG"

# APP_LOCALE is Laravel's lang/ locale, a plain language subtag; APP_LOCALES is
# the real thing. Flag the tags the enum doesn't know — AppServiceProvider throws
# on the first request for an unknown tag, so catching it here beats a red pod.
PRIMARY_TAG="${LOCALES%%,*}"
APP_LOCALE=$(printf '%s' "$PRIMARY_TAG" | cut -d- -f1 | tr 'A-Z' 'a-z')
UNKNOWN_TAGS=''
for tag in $(printf '%s' "$LOCALES" | tr ',' ' '); do
  if ! grep -qF "= '${tag}'" app/Enums/Locale.php; then
    UNKNOWN_TAGS="${UNKNOWN_TAGS} ${tag}"
  fi
done

NS="${SLUG}-${COUNTRY}"
IP_NAME="${SLUG}-${COUNTRY}-ip"
DB_NAME="${SNAKE}_${COUNTRY}_k8s"
[ -n "$DOMAIN" ] || DOMAIN="${SLUG}-${COUNTRY}.gorilladashstaging.com"

# What the USA overlay currently uses — replaced wholesale in the copy, so this
# works even after usa/ has been pointed at a production domain and IP.
OLD_HOST=$(perl -ne 'if (/^\s*-\s*host:\s*(\S+)/) { print $1; exit }' "${SRC}/ingress.yaml")
OLD_IP=$(perl -ne "if (/global-static-ip-name:\s*'?([^'\s]+)'?/) { print \$1; exit }" "${SRC}/ingress.yaml")

cp -R "$SRC" "$DST"

# In-place literal replace across the new overlay. Longest/most specific first:
# OLD_IP and OLD_HOST both contain "<slug>-usa", so they must go before it.
# The env assignment belongs on xargs (which passes it down to perl), NOT on
# find — a prefix on the first command of a pipeline never reaches the last.
replace_in_dst() {
  local from="$1" to="$2"
  [ -n "$from" ] || return 0
  find "$DST" -type f -print0 |
    FROM="$from" TO="$to" xargs -0 perl -pi -e 'BEGIN{$f=$ENV{FROM}; $t=$ENV{TO}} s/\Q$f\E/$t/g'
}
replace_in_dst "$OLD_IP" "$IP_NAME"
replace_in_dst "$OLD_HOST" "$DOMAIN"
replace_in_dst "overlays/usa" "overlays/${COUNTRY}"
replace_in_dst ".env.usa" ".env.${COUNTRY}"
replace_in_dst "${SLUG}-usa" "$NS"
replace_in_dst "${SNAKE}_usa_k8s" "$DB_NAME"

# Set a KEY=value line in config.env (env vars, so no shell quoting hazards).
set_env() {
  K="$1" V="$2" perl -pi -e 'BEGIN{$k=$ENV{K}; $v=$ENV{V}} s/^\Q$k\E=.*/$k=$v/' "${DST}/config.env"
}
set_env APP_NAME "'${BASE_NAME} ${CODE}'"
set_env APP_URL "https://${DOMAIN}"
set_env APP_LOCALE "$APP_LOCALE"
set_env APP_TIMEZONE "$TZONE"

# Every overlay states APP_LOCALES explicitly — a market's languages should never
# be implicit, and `php artisan env:use` refuses a country whose overlay omits it.
# The else-branch is kept for an overlay copied from an older checkout.
if grep -q '^APP_LOCALES=' "${DST}/config.env"; then
  set_env APP_LOCALES "$LOCALES"
else
  LOCALES="$LOCALES" perl -pi -e 'BEGIN{$l=$ENV{LOCALES}}
    s/^(APP_LOCALE=.*\n)/$1APP_LOCALES=$l\n/' "${DST}/config.env"
fi
set_env DB_DATABASE "$DB_NAME"
set_env COUNTRY "$CODE"

# Layer 3 of `php artisan env:use <country>`: the local overrides for this market.
# Without it the first switch to this country would compose a .env pointed at the
# Cloud SQL database and the staging host. Tracked (it is a template); the real
# .env.local.${COUNTRY} it seeds is gitignored.
LOCAL_ENV=".env.local.${COUNTRY}.example"
if [ ! -f "$LOCAL_ENV" ]; then
  sed -e "s/^# .* Layer 3 of .*/# ── Layer 3 of \`php artisan env:use ${COUNTRY}\`: local ${CODE} overrides ──/" \
      -e "s#^APP_URL=.*#APP_URL=http://${SLUG}-${COUNTRY}.test#" \
      -e "s/^DB_DATABASE=.*/DB_DATABASE=${DB_NAME%_k8s}/" \
      -e "s/overlays\/usa\/config.env/overlays\/${COUNTRY}\/config.env/" \
      -e "s/\.env\.local\.usa\b/.env.local.${COUNTRY}/g" \
      .env.local.usa.example > "$LOCAL_ENV"
  echo ">> Wrote ${LOCAL_ENV} (layer 3 for \`php artisan env:use ${COUNTRY}\`)"
fi

# Per-country identity/credentials — never inherited from another market.
for k in GD_ORG_ID GD_WEBSITE_ID GD_WEBSITE_CLIENT_ID GD_WEBSITE_CLIENT_SECRET \
         GOOGLE_MAP_API_KEY GOOGLE_MAP_ID TOLGEE_CDN_URL TOLGEE_API_KEY \
         CLOUDFLARE_ZONE_ID CLOUDFLARE_HOSTS; do
  set_env "$k" ''
done

# Comments that name the source market ("for the USA namespace", "USA database").
CODE="$CODE" perl -pi -e 'BEGIN{$c=$ENV{CODE}}
  s/ConfigMap for the \S+ namespace/ConfigMap for the $c namespace/;
  s/^# \S+ database\b/# $c database/;' "${DST}/config.env"

# Ingress: the annotation is commented out until the static IP exists (same as
# the USA overlay's go-live step), so only rewrite host + the annotation value.
#
# spec.tls repeats the host as a BARE list item under `hosts:`, with no `host:` key
# to match on — miss it and the new country presents a certificate for the source
# country's name, which fails as a 525 through the edge rather than as an error here.
# The second expression rewrites any bare list item that looks like the source host.
DOMAIN="$DOMAIN" perl -pi -e 'BEGIN{$d=$ENV{DOMAIN}}
  s/^(\s*-\s*host:\s*).*/$1$d/;
  s/^(\s*-\s+)[A-Za-z0-9._-]+\.[A-Za-z]{2,}\s*$/$1$d\n/;' "${DST}/ingress.yaml"

# Register the country in the deploy workflow's dropdown.
if grep -qE "^[[:space:]]*-[[:space:]]*${COUNTRY}[[:space:]]*$" "$WF"; then
  WF_NOTE="already listed"
else
  COUNTRY="$COUNTRY" perl -pi -e 'BEGIN{$c=$ENV{COUNTRY}} s/^(\s*)(# Add a new country here)/$1- $c\n$1$2/' "$WF"
  WF_NOTE="added to the country dropdown"
fi

ENUM_KEY=$(printf '%s' "$COUNTRY" | tr 'a-z-' 'A-Z_')

cat <<EOF

Created ${DST}
  namespace   ${NS}
  APP_NAME    ${BASE_NAME} ${CODE}
  APP_URL     https://${DOMAIN}
  COUNTRY     ${CODE}          (SupportCountryName value)
  DB_DATABASE ${DB_NAME}
  static IP   ${IP_NAME}       (annotation stays commented until it exists)
  APP_LOCALES ${LOCALES}       (APP_LOCALE=${APP_LOCALE}, tz ${TZONE})
${WF} — ${WF_NOTE}
EOF

if [ -n "$UNKNOWN_TAGS" ]; then
  cat <<EOF

!! App\Enums\Locale has no case for:${UNKNOWN_TAGS}
   AppServiceProvider throws on the first request until it does, so this market
   cannot boot yet. Use the add-locale skill — it is a data change (enum case +
   code() + label(), and resources/ts/constants/i18nLocales.ts); do NOT hand-edit
   routes or LocaleLink. Confirm Tolgee publishes the language too: an
   unpublished one renders every t() key's inline English default, silently.
EOF
fi

cat <<EOF

Still to do — none of this is scripted (needs auth, or a real value):

1) Frontend market maps (USA is the hardcoded fallback; add ${CODE} where the
   market differs, otherwise it silently serves USA content):
   - resources/ts/stores/countryLimits.ts   ${ENUM_KEY} = '${CODE}' in SupportCountryName, plus is${CODE}
   - resources/ts/services/locationsService.ts              TRIBE_TYPE_BY_COUNTRY
   - resources/ts/services/websiteMenus/websiteMenuService.ts   MAIN_MENU_NAMES
   - resources/ts/services/websiteMenus/footerMenuService.ts    FOOTER_MENU_NAMES
   - resources/ts/services/websiteComponents/callouts.ts        4 maps

2) GCP:
   gcloud compute addresses create ${IP_NAME} --global
   gcloud compute addresses describe ${IP_NAME} --global --format='value(address)'
   # DNS A record: ${DOMAIN} -> that IP
   # then uncomment global-static-ip-name in ${DST}/ingress.yaml
   # Cloud SQL: create database ${DB_NAME} + a DB user on gorilladash-client-v2
   make wi-bind COUNTRY=${COUNTRY}

3) Secret (per namespace, kept out of apply -k):
   cp ${DST}/secret.example.yaml ${DST}/secret.yaml   # gitignored; fill it in
   kubectl apply -f ${DST}/secret.yaml

4) Fill ${DST}/config.env: GD_ORG_ID, GD_WEBSITE_ID, GD_WEBSITE_CLIENT_ID/SECRET,
   GOOGLE_MAP_API_KEY, GOOGLE_MAP_ID, TOLGEE_CDN_URL, CLOUDFLARE_ZONE_ID,
   CLOUDFLARE_HOSTS (= ${DOMAIN}), and ROBOTS_INDEXABLE (leave false until the
   host is the real production one).

5) Local dev against this country:
   cp .env.local.${COUNTRY}.example .env.local.${COUNTRY}   # gitignored; fill it in
   php artisan env:use ${COUNTRY}

6) Deploy:  make ship-cloud COUNTRY=${COUNTRY}
EOF
