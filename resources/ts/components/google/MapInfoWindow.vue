<script setup lang="ts">
/**
 * Content for a map marker's InfoWindow. Rendered detached (via render(h(...))) into
 * the Google InfoWindow, so it must not rely on app context — no Tolgee/inject and no
 * <Link>. The name is a plain link upgraded to an Inertia (SPA) visit on click.
 *
 * For the same reason it can't call useLocale() (which reads page props): the active
 * locale arrives as a prop from GoogleMap, which does have app context.
 */
import { computed } from 'vue'
import { router } from '@inertiajs/vue3'
import { localizedUrl } from '@/lib/localizedUrl'
import { cmsRoute } from '@/lib/pagePaths'
import type { StoreLocation } from '@/constants/locations'

const props = defineProps<{ location: StoreLocation; localeCode: string }>()

const href = computed(() =>
  localizedUrl(
    cmsRoute('locations.show', { slug: props.location.id }, props.localeCode),
    props.localeCode
  )
)
const visit = () => router.visit(href.value)
</script>

<template>
  <div class="max-w-64 min-w-44 font-serif text-brand-primary">
    <a
      :href="href"
      class="font-condensed text-lg leading-tight font-medium tracking-wide text-brand-secondary uppercase transition-colors hover:text-brand-accent"
      @click.prevent="visit"
    >
      {{ location.name }}
    </a>
    <p
      v-if="location.addressLine1"
      class="mt-1.5 text-sm text-brand-primary/80"
    >
      {{ location.addressLine1 }}
    </p>
    <p
      v-if="location.addressLine2"
      class="text-sm text-brand-primary/80"
    >
      {{ location.addressLine2 }}
    </p>
  </div>
</template>
