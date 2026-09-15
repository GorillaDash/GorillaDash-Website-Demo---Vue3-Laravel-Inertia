/**
 * Locale types for the frontend. Kept in `constants/` (separate from
 * `plugins/tolgee.ts`) to avoid circular imports — other modules can read locale
 * codes without pulling in the whole Tolgee instance.
 *
 * App\Enums\Locale is the source of truth. Which locales a deployment actually
 * serves arrives at runtime as `page.props.config.locales` (per-country, no
 * rebuild), so nothing here enumerates the active set — this enum only names the
 * language tags the code may refer to literally, e.g. the fallback language.
 */
export enum I18nLocale {
  enUS = 'en-US',
  enAU = 'en-AU',
  jaJP = 'ja-JP',
  arEG = 'ar-EG'
}

/** Fallback when a deployment shares no locale at all (e.g. a unit-test render). */
export const defaultLocale = I18nLocale.enUS

/**
 * One entry of `page.props.config.locales`. `value` is the Tolgee language tag,
 * `code` the URL segment (`en-US` → `/en`), `label` the language's own name.
 */
export type LocaleOption = {
  value: string
  code: string
  label: string
}
