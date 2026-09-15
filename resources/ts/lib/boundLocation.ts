import { router } from '@inertiajs/vue3'

/**
 * The bound ("locked") store, written straight to a cookie by the browser.
 *
 * The location pages call these after mount, so their GET renders stay pure reads that
 * the CDN edge may cache (see App\Http\Middleware\EdgeCacheGuestPage). The server
 * reads the same cookie back and shares it as the `boundLocation` prop, so the binding
 * is on the very next render — SSR included.
 *
 * This replaces a POST/DELETE beacon pair. Those needed a CSRF token, the token needed
 * /csrf-cookie, and that response handed the visitor a Laravel session cookie — which
 * the edge's bypass rule treats as "personalized, go to origin" for every subsequent
 * request. A plain cookie that rule ignores costs no round trip and no session.
 *
 * The value is a public store slug. Tampering with it shows a different store, which is
 * a thing the visitor could do by clicking; the server re-resolves it and renders null
 * when it matches nothing (see App\Services\BoundLocation).
 */

/** Must match App\Services\BoundLocation::COOKIE, and must not look like `*-session`. */
const COOKIE = 'gd_store'

/** Long enough to survive a return visit, short enough that a stale store expires. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const read = (): string | null => {
  const match = document.cookie.match(/(?:^|;\s*)gd_store=([^;]*)/)

  return match ? decodeURIComponent(match[1]) : null
}

const write = (value: string, maxAge: number): void => {
  const secure = window.location.protocol === 'https:' ? '; secure' : ''

  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`
}

/** Refresh the shared prop so the header/footer reflect the new binding. */
const reloadBoundLocation = (): void => {
  router.reload({ only: ['boundLocation'] })
}

/** Bind a store — the location detail page fires this after mount. */
export function bindBoundLocation(slug: string): void {
  // Already bound to this store: skip the write and, more importantly, the reload.
  // The old beacon POSTed on every visit to a page the visitor was already locked to.
  if (!slug || read() === slug) {
    return
  }

  write(slug, MAX_AGE_SECONDS)
  reloadBoundLocation()
}

/**
 * Drop the bound store — the /locations index and state pages fire this after mount
 * (the visitor has stepped back out to browse). A visitor with no cookie does nothing,
 * so browsing costs them neither a write nor a reload.
 */
export function clearBoundLocation(): void {
  if (read() === null) {
    return
  }

  write('', 0)
  reloadBoundLocation()
}
