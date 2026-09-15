<script setup lang="ts">
/**
 * Inertia's <Link> with the active locale prefixed onto `href`.
 *
 * Every internal link must go through this. Wayfinder's `menu.url()` returns the
 * canonical `/menu`, but a multilingual deployment serves that page at `/jp/menu`
 * (routes/web.php); an unwrapped <Link> would render an `<a href="/menu">`, which
 * still resolves — routes/web.php redirects it — but costs a 302 and hands crawlers
 * the wrong URL. On a monolingual deployment the prefix is empty and this is a
 * transparent pass-through.
 *
 * Attributes and Inertia's own props (`method`, `preserveScroll`, `prefetch`, …)
 * fall through to <Link> untouched.
 */
import { computed } from 'vue'
import { Link } from '@inertiajs/vue3'
import { useLocale } from '@/composables/useLocale'
import type { RouteDefinition } from '@/wayfinder'

/** Either a plain path or a Wayfinder route object, the two things <Link> takes. */
type LinkHref = string | RouteDefinition<'get'>

const props = defineProps<{ href: LinkHref }>()

const { localizedUrl } = useLocale()

const href = computed<LinkHref>(() =>
  typeof props.href === 'string'
    ? localizedUrl(props.href)
    : { ...props.href, url: localizedUrl(props.href.url) }
)
</script>

<template>
  <Link :href="href">
    <slot />
  </Link>
</template>
