import { computed } from 'vue'
import { defaultLocale, type LocaleOption } from '@/constants/i18nLocales'
import { localizedUrl as prefix, stripLocalePrefix } from '@/lib/localizedUrl'
import { translatePagePath } from '@/lib/pagePaths'
import { runtimeConfig } from '@/runtimeConfig'
import { useSharedProps } from '@/composables/useSharedProps'

/** The request's locale, as `page.props.locale` carries it. */
type LocaleProp = {
  /** Tolgee language tag, e.g. `ja-JP`. Also what GD's GraphQL `locale` argument takes. */
  value: string
  /** URL segment, e.g. `jp`. */
  code: string
}

/**
 * The active locale and the deployment's locale set.
 *
 * The locale is per-request, so it comes from `useSharedProps()` (SSR-safe) rather than
 * `usePage()`; the set of available locales is a deployment constant and comes from
 * runtimeConfig. Reading the locale from the racy module-level page would let one
 * request render another's language — and the edge would cache it under the wrong URL.
 *
 * `isMultilingual` is the single flag the UI keys on: it decides whether links carry a
 * `/{locale}` prefix and whether a language switcher should render at all. For a
 * single-language country it is false and nothing about the site changes.
 */
export function useLocale() {
  const { props, url } = useSharedProps()
  const locales = computed<LocaleOption[]>(() => runtimeConfig().locales)

  const current = computed<LocaleProp>(() => {
    const fallback = { value: defaultLocale, code: locales.value[0]?.code ?? 'en' }

    return (props.value.locale as LocaleProp | undefined) ?? fallback
  })

  const locale = computed(() => current.value.value)
  const localeCode = computed(() => current.value.code)
  const isMultilingual = computed(() => locales.value.length > 1)

  /** The active locale's entry in the deployment's set — its label, for a switcher. */
  const currentLocale = computed(() =>
    locales.value.find((option) => option.value === locale.value)
  )

  /** Prefix an app-relative URL with the active locale. Identity on a monolingual deployment. */
  const localizedUrl = (value: string): string => prefix(value, localeCode.value)

  /**
   * The page the visitor is on, under a different locale.
   *
   * Must be followed as a full page load, not an Inertia visit: the Tolgee instance is
   * built once per boot with a fixed language (setupApp), and `<html lang>` is rendered
   * by the server. An SPA visit would swap the props and leave both stale.
   *
   * CMS pages may live at a different slug per locale, so strip-then-reprefix isn't
   * enough: the path's first segment is translated through the page-path map first
   * (`/en/stores/x` → `/ar/<ar-slug>/x`). Non-CMS paths pass through unchanged.
   */
  const switchUrl = (code: string): string =>
    prefix(translatePagePath(stripLocalePrefix(url.value), localeCode.value, code), code)

  return {
    locale,
    localeCode,
    locales,
    currentLocale,
    isMultilingual,
    localizedUrl,
    switchUrl
  }
}
