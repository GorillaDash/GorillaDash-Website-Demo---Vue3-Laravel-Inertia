#!/usr/bin/env bash
#
# Prove the cache rules actually behave, by asking the live edge.
#
#   CLOUDFLARE probes: ./deploy/cloudflare/verify-rules.sh <host>
#
# Every probe is a real request to the public host, judged by cf-cache-status:
#
#   anonymous page     -> HIT / MISS / EXPIRED / REVALIDATED   (cacheable)
#   session cookie     -> DYNAMIC / BYPASS                     (never shared)
#   X-Inertia          -> DYNAMIC / BYPASS                     (never shared)
#   ?debug=1           -> DYNAMIC / BYPASS                     (uncached view)
#   ?__fresh=          -> DYNAMIC / BYPASS                     (skew recovery)
#
# This exists because the bypass expressions are the one part of the setup that can
# fail SILENTLY. A rule whose expression never matches is not an error anywhere: the
# dashboard shows it, the API accepts it, and the only symptom is that a logged-in or
# flash-carrying render quietly becomes the copy every visitor gets. Cloudflare ignores
# Vary outside Accept-Encoding, so there is no second gate to catch it either. Asserting
# the behaviour from outside is the only honest check.
#
# A page must be cacheable for the negative probes to mean anything — if the anonymous
# probe never caches, "DYNAMIC" proves nothing about the bypass rules. So that is
# checked first and everything else is skipped when it fails.
set -euo pipefail

HOST="${1:-}"
[[ -n "${HOST}" ]] || { echo "usage: $0 <host>" >&2; exit 1; }

URL="https://${HOST}/"
FAILED=0

# cf-cache-status for one request. Extra curl args are passed through.
cache_status() {
  curl -sS -o /dev/null -D - --max-time 20 "$@" 2>/dev/null \
    | tr -d '\r' | awk 'tolower($1) == "cf-cache-status:" { print $2 }' | tail -1
}

probe() {
  local label="$1" want="$2" got; shift 2
  got="$(cache_status "$@")"
  if [[ "${got}" =~ ^(${want})$ ]]; then
    printf '  PASS  %-28s cf-cache-status: %s\n' "${label}" "${got:-<none>}"
  else
    printf '  FAIL  %-28s cf-cache-status: %s (wanted %s)\n' "${label}" "${got:-<none>}" "${want}"
    FAILED=$((FAILED + 1))
  fi
}

echo ">> Verifying cache rules on ${HOST}"

# Warm the object first: the very first request after a rule change is a MISS
# everywhere, and a MISS is a perfectly good "this is cacheable" answer, but a HIT is
# a better one. Two requests give the second probe a chance to be a HIT.
cache_status "${URL}" >/dev/null || true

probe "anonymous page" 'HIT|MISS|EXPIRED|REVALIDATED|UPDATING' "${URL}"
CACHEABLE=$FAILED

if [[ ${CACHEABLE} -ne 0 ]]; then
  echo "!! The anonymous page is not cacheable, so the bypass probes below would pass"
  echo "   for the wrong reason. Fix this first — likely the origin's Cache-Control:"
  echo "   no-cache, private is blocking despite Cloudflare-CDN-Cache-Control (see"
  echo "   App\\Http\\EdgeCacheGrant), which needs a Cache Response Rule to drop the"
  echo "   directive before the cache decision, not a change at the origin."
  exit 1
fi

# The negatives. Each must be excluded by exactly one bypass rule.
probe "session cookie"  'DYNAMIC|BYPASS' -H 'Cookie: the-great-greek-usa-session=probe' "${URL}"
probe "X-Inertia XHR"   'DYNAMIC|BYPASS' -H 'X-Inertia: true' "${URL}"
probe "?debug=1"        'DYNAMIC|BYPASS' "${URL}?debug=1"
probe "?__fresh="       'DYNAMIC|BYPASS' "${URL}?__fresh=probe"

if [[ ${FAILED} -ne 0 ]]; then
  echo "!! ${FAILED} probe(s) failed — personalized responses may be reaching the shared cache."
  echo "   Roll the rules back NOW (apply-rules.sh does this automatically when it runs"
  echo "   the probes itself), then fix the expression before re-applying."
  exit 1
fi

echo ">> All probes passed."
