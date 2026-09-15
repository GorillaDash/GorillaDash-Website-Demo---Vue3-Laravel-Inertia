/**
 * Format a GD CMS timestamp ("2026-07-29 00:00:00") for display.
 *
 * The value is a CALENDAR DATE, not an instant, so this deliberately does no timezone
 * conversion: it slices to the date part and builds a LOCAL date, whose Y/M/D are the
 * same fields in every timezone. That is what keeps SSR (server TZ) and the browser
 * (viewer TZ) rendering the same day. Handing the raw string to `new Date()` instead
 * parses it as UTC and lands on the previous day west of the meridian, which Vue then
 * reports as a hydration mismatch.
 *
 * Intl rather than a date library on purpose — one formatter, no dependency for a
 * starter to carry. If a site needs real date arithmetic, add date-fns there.
 *
 * The locale is fixed to en-US, matching the rest of the starter's untranslated
 * chrome. A multilingual site that shows CMS dates should pass the active locale
 * through instead.
 *
 * See tests/js/cmsDate.test.ts.
 */
export const formatCmsDate = (value: string | null | undefined, locale = 'en-US'): string => {
  const [year, month, day] = (value ?? '').slice(0, 10).split('-').map(Number)

  if (!year || !month || !day) {
    return ''
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(year, month - 1, day))
}
