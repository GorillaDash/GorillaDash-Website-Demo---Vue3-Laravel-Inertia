#!/usr/bin/env bash
#
# The cache rules this repo owns, as JSON, for one host.
#
# Sourced by apply-rules.sh and verify-rules.sh so that the rules being applied and
# the rules being verified can never be two different opinions. Prints a JSON array
# on stdout: gd_cache_rules <host>
#
# ORDER IS THE WHOLE DESIGN. Cache Rules STACK — every matching rule contributes its
# settings and, where two rules set the same one, THE LAST MATCH WINS. That is the
# opposite of the first-match-wins intuition, and getting it backwards silently caches
# personalized pages:
#
#   1. cache-html          make the host's HTML eligible at all, origin decides the TTL
#   2. bypass-personalized ... except when the visitor is not anonymous          <- wins
#   3. bypass-debug        ... or is explicitly asking to see an uncached render <- wins
#   4. cache-build-assets  ... but a fingerprinted asset is cacheable regardless <- wins
#
# The bypasses must sit AFTER the general rule to override it, and cache-build-assets
# after the bypasses so an engaged visitor does not lose asset caching for a whole
# session over a cookie that has nothing to do with /build/.
#
# Every rule is scoped to one host. The entrypoint ruleset is ZONE-wide and this zone
# carries other GorillaDash sites, so an unscoped rule would silently change caching
# for somebody else's site.

# Emit the rule array for $1 (the public hostname).
gd_cache_rules() {
  local host="$1"
  local ref_prefix
  ref_prefix="gd_$(printf '%s' "${host}" | tr '.-' '__')"

  jq -n --arg host "${host}" --arg p "${ref_prefix}" '
    [
      {
        ref: ($p + "_cache_html"),
        description: "GD: HTML is eligible for cache; the origin decides per response",
        expression: ("http.host eq \"" + $host + "\""),
        action: "set_cache_settings",
        action_parameters: {
          cache: true,
          # respect_origin, NOT override_origin: EdgeCacheGuestPage grants a shared copy
          # per response and withholds it from anything personalized. Overriding the
          # origin here would cache what it deliberately refused to grant, and would also
          # flatten robots.txt(3600) onto a page TTL(120).
          edge_ttl: { mode: "respect_origin" },
          browser_ttl: { mode: "respect_origin" }
        }
      },
      {
        ref: ($p + "_bypass_personalized"),
        description: "GD: never cache a render that is not anonymous (session cookie / Inertia XHR)",
        # A Laravel session cookie is "<app-slug>-session"; DropEmptyGuestSession makes
        # sure an ordinary guest never receives one, so its presence means auth or
        # flashed state. X-Inertia marks SPA navigations and partial reloads, whose JSON
        # shape varies with the requested props.
        #
        # This rule is the ONLY gate keeping a personalized render out of the shared
        # cache: Cloudflare ignores Vary outside Accept-Encoding, so unlike on a VCL
        # edge there is no second gate behind it. Withholding the origin grant
        # (EdgeCacheGuestPage) does NOT on its own keep these out of the cache.
        expression: ("http.host eq \"" + $host + "\" and (http.cookie contains \"-session=\" or len(http.request.headers[\"x-inertia\"][0]) > 0)"),
        action: "set_cache_settings",
        action_parameters: { cache: false }
      },
      {
        ref: ($p + "_bypass_debug"),
        description: "GD: ?debug=1 is the uncached view; ?__fresh= is version-skew recovery",
        # ?debug=1 must reach origin or it is not a debugging view. ?__fresh=<version> is
        # the reload HandleInertiaRequests sends a stale client to; serving it from cache
        # would hand back the same stale HTML and re-trigger the 409 it is escaping.
        expression: ("http.host eq \"" + $host + "\" and (http.request.uri.query contains \"debug=1\" or http.request.uri.query contains \"__fresh=\")"),
        action: "set_cache_settings",
        action_parameters: { cache: false }
      },
      {
        ref: ($p + "_cache_build_assets"),
        description: "GD: /build/ is fingerprinted by Vite — cache a year, whoever is asking",
        # Last, so it wins over the bypasses above: the bytes behind a hashed filename
        # never change, and there is no reason a visitor holding a session cookie should
        # re-fetch every asset. Anything outside /build/ is not fingerprinted and gets no
        # such grant.
        expression: ("http.host eq \"" + $host + "\" and starts_with(http.request.uri.path, \"/build/\")"),
        action: "set_cache_settings",
        action_parameters: {
          cache: true,
          edge_ttl: { mode: "override_origin", default: 31536000 },
          browser_ttl: { mode: "override_origin", default: 31536000 }
        }
      }
    ]'
}

# The ref prefix identifying the rules this repo manages for $1. Anything else on the
# zone belongs to another site and must survive untouched.
gd_ref_prefix() {
  printf 'gd_%s' "$(printf '%s' "$1" | tr '.-' '__')"
}
