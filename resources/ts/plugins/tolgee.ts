/**
 * Tolgee i18n — in-context editing (dev) + ICU formatting + remote translations
 * from the GD localization backend.
 *
 * Config is read from runtimeConfig() (server-injected per-country via
 * page.props.config), NOT build-time VITE_ vars — so a single bundle serves every
 * country and values change without a rebuild. When a value is empty the matching
 * plugin is skipped; keys still render via their `default`, so the app works
 * before the backend exists.
 *
 * Translations are fetched ONCE per language on the SSR server (`preloadTranslations`,
 * memoized) and handed to the browser as `window.__TOLGEE_STATE__`, exactly as the
 * Apollo cache is. Tolgee only reads a language's records once they are in its cache,
 * so without this the server would render every key's inline `default` — English —
 * into HTML that the edge then caches for a Japanese URL. Passing the same records as
 * `staticData` on the client means the first render matches the server's and there is
 * no hydration flash.
 *
 * Built as a factory (like createApolloClient): call from setupApp AFTER
 * setRuntimeConfig() so the values are populated, and so each client boot / SSR
 * request gets a fresh instance (SSR-safe — no shared language state). The language
 * is passed in per request rather than read from runtimeConfig, which is module scope.
 */
import { DevTools, FormatSimple, Tolgee, BackendFetch } from '@tolgee/vue'
import type { CachePublicRecord, TolgeeInstance } from '@tolgee/vue'
import { FormatIcu } from '@tolgee/format-icu'
import { I18nLocale, defaultLocale } from '@/constants/i18nLocales'
import { runtimeConfig } from '@/runtimeConfig'

/** Translations for one language, as transferred SSR → client. */
export type TolgeeRecords = CachePublicRecord[]

declare global {
  interface Window {
    __TOLGEE_STATE__?: TolgeeRecords
  }
}

/**
 * SSR-only cache of fetched translations, keyed by language. Without it every SSR
 * render would make a blocking round trip to the translation CDN — the render is
 * already this site's TTFB bottleneck. Records are plain data, so sharing them
 * across concurrent requests is safe; the Tolgee instances built from them are not
 * shared.
 */
const SSR_RECORDS_TTL_MS = 5 * 60 * 1000
const ssrRecords = new Map<string, { at: number; records: Promise<TolgeeRecords> }>()

/**
 * Guarantee the cache holds a record for the active language and the fallback.
 *
 * `tolgee.isLoaded()` is false until `cache.exists()` for every required
 * language/namespace pair, and TolgeeProvider renders `null` — not its children —
 * while it is false. On the server that state is terminal: the `run()` that would
 * clear it lives in onBeforeMount. So a deployment with no TOLGEE_CDN_URL, or one
 * whose CDN fetch failed, would serve blank SSR HTML — and the edge would cache it.
 *
 * An empty record is the honest representation of "nothing to translate for this
 * language": keys then render their inline `default`, which is what the app did
 * before Tolgee had a backend.
 */
function withSeededLanguages(language: string, staticData?: TolgeeRecords): TolgeeRecords {
  const records = [...(staticData ?? [])]

  for (const seeded of new Set([language, I18nLocale.enUS])) {
    const present = records.some((record) => record.language === seeded && record.namespace === '')

    if (!present) {
      records.push({ language: seeded, namespace: '', data: {} })
    }
  }

  return records
}

function build(language: string, staticData?: TolgeeRecords): TolgeeInstance {
  const { tolgeeApiUrl, tolgeeApiKey, tolgeeCdnUrl, locales } = runtimeConfig()

  let instance = Tolgee().use(DevTools()).use(FormatSimple()).use(FormatIcu())

  if (tolgeeCdnUrl) {
    instance = instance.use(BackendFetch({ prefix: tolgeeCdnUrl }))
  }

  return instance.init({
    language,
    fallbackLanguage: I18nLocale.enUS,
    availableLanguages: locales.length ? locales.map((locale) => locale.value) : [defaultLocale],
    staticData,
    apiUrl: tolgeeApiUrl || undefined,
    apiKey: tolgeeApiKey || undefined
  })
}

/**
 * Fetch (and memoize) a language's translations on the SSR server. Resolves to an
 * empty set when no CDN is configured, or when the fetch fails — the app then falls
 * back to each key's inline `default` rather than failing the render.
 */
export async function preloadTranslations(language: string): Promise<TolgeeRecords> {
  if (!runtimeConfig().tolgeeCdnUrl) {
    return []
  }

  const cached = ssrRecords.get(language)
  if (cached && Date.now() - cached.at < SSR_RECORDS_TTL_MS) {
    return cached.records
  }

  // A throwaway instance with an empty cache — seeding it (as createTolgee does)
  // would make loadRequired() believe there is nothing left to fetch.
  const records = build(language)
    .loadRequired()
    .then((loaded) =>
      loaded.map(({ data, language: recordLanguage, namespace }) => ({
        data,
        language: recordLanguage,
        namespace
      }))
    )
    .catch(() => {
      // Don't let a bad fetch poison the cache for the next five minutes.
      ssrRecords.delete(language)

      return [] as TolgeeRecords
    })

  ssrRecords.set(language, { at: Date.now(), records })

  return records
}

/**
 * A Tolgee instance for one request / one client boot, prefilled with the
 * translations the server already fetched (explicitly under SSR, from
 * `window.__TOLGEE_STATE__` in the browser).
 */
export function createTolgee(language: string, staticData?: TolgeeRecords): TolgeeInstance {
  const records =
    staticData ?? (typeof window === 'undefined' ? undefined : window.__TOLGEE_STATE__)

  return build(language, withSeededLanguages(language, records))
}
