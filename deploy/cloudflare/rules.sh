#!/usr/bin/env bash
#
# The GorillaDash cache rules, as JSON, for every GD host on one zone.
#
# Sourced by apply-rules.sh so the rules being applied have one definition. Prints a
# JSON array on stdout: gd_cache_rules <host> [<host> ...]
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
# ONE SET OF FOUR FOR THE WHOLE ZONE, NOT FOUR PER HOST. Every GD site on a zone gets
# byte-identical rules, so the only thing that differs is the host — and a zone's plan
# caps how many cache rules it may hold (10 on gorilladashstaging.com). Four per host hit
# that cap at the third client. So each rule matches a SET of hosts,
# `http.host in {"a" "b"}`, and adding a client adds a host to the set, not rules to
# the zone. apply-rules.sh owns that set: it reads it back, adds to it, and never drops
# a host it was not asked to (see its header for the lock that keeps two repos from
# overwriting each other).
#
# Every rule is still scoped to the hosts in the set, never the bare zone: the
# entrypoint ruleset is ZONE-wide and the zone carries sites that are not GD's, so an
# unscoped rule would silently change caching for somebody else's site.

# The ref prefix of the shared rules. Anything else on the zone belongs to something
# else and must survive untouched.
GD_SHARED_PREFIX="gd_shared_"

# The suffixes of the four rules. Before the rules were shared, each host had its own
# four, refs "gd_<host with . and - as _>_<suffix>"; apply-rules.sh folds a host that
# still carries all four into the set and deletes them.
GD_RULE_SUFFIXES=(cache_html bypass_personalized bypass_debug cache_build_assets)

# Emit the rule array for the hosts given (public hostnames).
gd_cache_rules() {
  local hosts
  hosts=$(printf '%s\n' "$@" | sort -u | jq -R . | jq -sc .)

  jq -n --argjson hosts "${hosts}" --arg p "${GD_SHARED_PREFIX}" '
    ("http.host in {" + ($hosts | map("\"" + . + "\"") | join(" ")) + "}") as $in |
    [
      {
        ref: ($p + "cache_html"),
        description: "GD: HTML is eligible for cache; the origin decides per response",
        expression: $in,
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
        ref: ($p + "bypass_personalized"),
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
        expression: ($in + " and (http.cookie contains \"-session=\" or len(http.request.headers[\"x-inertia\"][0]) > 0)"),
        action: "set_cache_settings",
        action_parameters: { cache: false }
      },
      {
        ref: ($p + "bypass_debug"),
        description: "GD: ?debug=1 is the uncached view; ?__fresh= is version-skew recovery",
        # ?debug=1 must reach origin or it is not a debugging view. ?__fresh=<version> is
        # the reload HandleInertiaRequests sends a stale client to; serving it from cache
        # would hand back the same stale HTML and re-trigger the 409 it is escaping.
        expression: ($in + " and (http.request.uri.query contains \"debug=1\" or http.request.uri.query contains \"__fresh=\")"),
        action: "set_cache_settings",
        action_parameters: { cache: false }
      },
      {
        ref: ($p + "cache_build_assets"),
        description: "GD: /build/ is fingerprinted by Vite — cache a year, whoever is asking",
        # Last, so it wins over the bypasses above: the bytes behind a hashed filename
        # never change, and there is no reason a visitor holding a session cookie should
        # re-fetch every asset. Anything outside /build/ is not fingerprinted and gets no
        # such grant.
        expression: ($in + " and starts_with(http.request.uri.path, \"/build/\")"),
        action: "set_cache_settings",
        action_parameters: {
          cache: true,
          edge_ttl: { mode: "override_origin", default: 31536000 },
          browser_ttl: { mode: "override_origin", default: 31536000 }
        }
      }
    ]'
}

# The hosts a stored shared rule matches, one per line: the inverse of the
# `http.host in {...}` this file writes. Reads the cache_html rule, whose expression is
# the set and nothing else.
gd_shared_hosts() {
  jq -r --arg ref "${GD_SHARED_PREFIX}cache_html" '
    .[] | select(.ref == $ref) | .expression
    | capture("^http\\.host in \\{(?<set>[^}]*)\\}$").set
    | scan("\"([^\"]+)\"") | .[0]'
}
