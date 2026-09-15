// Per-country public config, shared from the server via the `config` Inertia prop
// (HandleInertiaRequests::share) and set once at app boot in app.ts (the single
// entry used for both the client and SSR builds). It's read by code that runs too
// deep to receive props directly — the Google Maps loader, the country store, the
// Apollo APQ hash suffix, the document title.
//
// These are deployment constants (the same value on every request), so holding
// them in module scope is SSR-safe: concurrent SSR requests all set identical
// values. This replaces the old build-time `import.meta.env.VITE_*` reads, which
// baked from `.env.example` and so could neither be per-country nor changed
// without a rebuild.

import type { LocaleOption } from '@/constants/i18nLocales'

//
// Note what is NOT here: the request's own locale. It varies per request, and
// `renderToString` interleaves concurrent SSR renders at every await, so a
// module-scope locale would be read back by the wrong request. It travels as a
// per-request Inertia prop instead — read it with usePage() via @/composables/useLocale.
// The *set* of locales a deployment serves is a constant, so it lives here.

export type RuntimeConfig = {
  appName: string
  /** This deployment's public origin (`APP_URL`), for canonical, hreflang and JSON-LD URLs. */
  siteUrl: string | null
  googleMapApiKey: string | null
  googleMapId: string | null
  orgId: string | null
  websiteId: string | null
  country: string | null
  locales: LocaleOption[]
  /** reCAPTCHA v3 site key; null on a deployment with no captcha configured. */
  recaptchaSiteKey: string | null
  tolgeeApiUrl: string | null
  tolgeeApiKey: string | null
  tolgeeCdnUrl: string | null
}

let current: RuntimeConfig = {
  appName: 'Laravel',
  siteUrl: null,
  googleMapApiKey: null,
  googleMapId: null,
  orgId: null,
  websiteId: null,
  country: null,
  locales: [],
  recaptchaSiteKey: null,
  tolgeeApiUrl: null,
  tolgeeApiKey: null,
  tolgeeCdnUrl: null
}

/** Merge runtime config from Inertia shared props. Called once per boot/request. */
export function setRuntimeConfig(config: Partial<RuntimeConfig>): void {
  current = { ...current, ...config }
}

/** Read the active runtime config. */
export function runtimeConfig(): RuntimeConfig {
  return current
}
