import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/** The two SEO fields every GD website page carries. */
type WebsitePageMetaSource = {
  meta_title: string | null
  meta_description: string | null
}

/**
 * <title> + meta description for a CMS-backed page, shaped for SeoHead.
 *
 * The editor's `meta_title` / `meta_description` on the GD website page win
 * whenever they're filled in. An empty title falls back to the caller's default
 * (the CMS page name, a translated label); an empty description yields '' and
 * SeoHead substitutes the site-wide default description, so no page ships
 * without one.
 *
 * Whitespace is collapsed on the way out. CMS fields carry stray spaces — an
 * editor's trailing space on a `meta_title` is routine — and these values do NOT
 * all pass through a title callback that would otherwise tidy them: SeoHead sends
 * the same strings to `og:title` / `og:description` and `<meta name="description">`
 * directly.
 */
const tidy = (value: string | null | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim()

export function useWebsitePageMeta(
  page: MaybeRefOrGetter<WebsitePageMetaSource | null | undefined>,
  fallbackTitle: MaybeRefOrGetter<string> = ''
) {
  const metaTitle = computed(() => tidy(toValue(page)?.meta_title) || tidy(toValue(fallbackTitle)))
  const metaDescription = computed(() => tidy(toValue(page)?.meta_description))

  return { metaTitle, metaDescription }
}
