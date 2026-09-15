<script setup lang="ts">
import { computed } from 'vue'
import { Head } from '@inertiajs/vue3'
import { useTranslate } from '@tolgee/vue'
import { useLocale } from '@/composables/useLocale'
import { useSharedProps } from '@/composables/useSharedProps'
import {
  absoluteUrl,
  hreflangLinks,
  openGraphLocale,
  serializeJsonLd,
  type JsonLd
} from '@/lib/seo'
import { runtimeConfig } from '@/runtimeConfig'

// Port of the old @/services/headMeta useHeadMetaService to Inertia's <Head>.
// `head-key` dedupes each tag so navigating between pages replaces rather than
// stacks them. With `bindOg` (default), og:title/og:description mirror
// title/description — the same behaviour as the old service's bindOg sync.
//
// Everything a page does NOT pass is filled in here, so no page can ship without
// it: the description falls back to the site-wide default, the canonical comes
// from the `canonicalUrl` shared prop (HandleInertiaRequests), and hreflang
// alternates appear on their own once a deployment serves a second locale.
const {
  title = '',
  description = '',
  url = '',
  image = '',
  bindOg = true,
  canonical = '',
  noindex = false,
  type = 'website',
  jsonLd = null
} = defineProps<{
  title?: string
  description?: string
  url?: string
  image?: string
  bindOg?: boolean
  /** Override the shared canonical — an editor's `meta_canonical` on an article. */
  canonical?: string
  /** Keep this page out of the index (an article flagged `no_index` in GD). */
  noindex?: boolean
  /** Open Graph object type: `website` for pages, `article` for news. */
  type?: 'website' | 'article'
  /** A schema.org document (or several) to inline as JSON-LD; see @/lib/seo. */
  jsonLd?: JsonLd | JsonLd[] | null
}>()

const { t } = useTranslate()
const { props } = useSharedProps()
const { locale, locales, isMultilingual, switchUrl } = useLocale()

const siteUrl = computed(() => runtimeConfig().siteUrl)
const siteName = computed(() => runtimeConfig().appName)

// The default is a Tolgee key so a locale (or a second country) can reword it without
// a deploy. ⚠ NEW CLIENT: rewrite this source string — it is the description every page
// that does not set its own ships with, and the placeholder below says nothing useful
// about the business. One or two sentences, under ~160 characters.
const metaDescription = computed(
  () =>
    description ||
    t.value(
      'seo.defaultDescription',
      'Acme Diner — find a location near you, see what we offer and get in touch.'
    )
)

const canonicalHref = computed(() => {
  const value = canonical || (props.value.canonicalUrl as string | undefined) || ''

  return value ? absoluteUrl(siteUrl.value, value) : ''
})

const ogUrl = computed(() => url || canonicalHref.value)

// One `rel="alternate"` per served locale, pointing at THIS page under that locale
// (the same URLs the language switcher offers), plus x-default. Empty until a
// deployment serves more than one locale, so monolingual markup is unchanged.
const alternates = computed(() =>
  isMultilingual.value ? hreflangLinks(siteUrl.value, locales.value, switchUrl) : []
)

const jsonLdJson = computed(() => (jsonLd ? serializeJsonLd(jsonLd) : ''))
</script>

<template>
  <Head :title="title || undefined">
    <meta
      head-key="description"
      name="description"
      :content="metaDescription"
    />
    <link
      v-if="canonicalHref"
      head-key="canonical"
      rel="canonical"
      :href="canonicalHref"
    />
    <link
      v-for="alternate in alternates"
      :key="alternate.hreflang"
      :head-key="`alternate:${alternate.hreflang}`"
      rel="alternate"
      :hreflang="alternate.hreflang"
      :href="alternate.href"
    />
    <meta
      v-if="noindex"
      head-key="robots"
      name="robots"
      content="noindex, follow"
    />
    <meta
      v-if="bindOg && title"
      head-key="og:title"
      property="og:title"
      :content="title"
    />
    <meta
      v-if="bindOg"
      head-key="og:description"
      property="og:description"
      :content="metaDescription"
    />
    <meta
      v-if="bindOg && ogUrl"
      head-key="og:url"
      property="og:url"
      :content="ogUrl"
    />
    <meta
      v-if="image"
      head-key="og:image"
      property="og:image"
      :content="image"
    />
    <meta
      v-if="bindOg"
      head-key="og:type"
      property="og:type"
      :content="type"
    />
    <meta
      v-if="bindOg && siteName"
      head-key="og:site_name"
      property="og:site_name"
      :content="siteName"
    />
    <meta
      v-if="bindOg"
      head-key="og:locale"
      property="og:locale"
      :content="openGraphLocale(locale)"
    />
    <meta
      head-key="twitter:card"
      name="twitter:card"
      :content="image ? 'summary_large_image' : 'summary'"
    />
    <!-- A literal <script> is rejected by Vue's template compiler ("tags with side
         effect"); the dynamic form compiles to a plain 'script' vnode, which Inertia's
         Head serialises with its text child verbatim (see serializeJsonLd for the
         escaping that makes that safe). -->
    <component
      :is="'script'"
      v-if="jsonLdJson"
      head-key="ld+json"
      type="application/ld+json"
      >{{ jsonLdJson }}</component
    >
  </Head>
</template>
