<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import TribeOpenBadge from '@/components/tribe/TribeOpenBadge.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import type { TribeSummary } from '@/composables/useTribes'
import { tribePhoto } from '@/lib/demoImagery'

const props = withDefaults(
  defineProps<{
    tribe: TribeSummary
    distanceMiles?: number | null
    compact?: boolean
    selected?: boolean
  }>(),
  { distanceMiles: null, compact: false, selected: false }
)

const emit = defineEmits<{ select: [slug: string] }>()

const { t } = useTranslate()
const { cmsRoute, pagePath } = usePagePaths()

const openingSoon = computed(() => props.tribe.status === 'Opening Soon')
const shortName = computed(() => props.tribe.name.replace(/^Hungry Gorilla\s+/i, ''))
const href = computed(() => cmsRoute('locations.show', { slug: props.tribe.slug }))
</script>

<template>
  <article
    class="group flex overflow-hidden rounded-card border bg-white transition hover:shadow-lg"
    :class="[
      compact ? 'flex-row' : 'flex-col',
      selected ? 'border-brand-accent ring-2 ring-brand-accent/30' : 'border-brand-tint-strong'
    ]"
    @mouseenter="emit('select', tribe.slug)"
  >
    <LocaleLink
      :href="href"
      class="relative block shrink-0 overflow-hidden"
      :class="compact ? 'w-32 sm:w-40' : 'aspect-16/10'"
      tabindex="-1"
      aria-hidden="true"
    >
      <SmartImage
        :src="tribePhoto(tribe.slug, 700)"
        :alt="tribe.name"
        class="size-full transition duration-500 group-hover:scale-105"
      />
    </LocaleLink>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <TribeOpenBadge
          :hours="tribe.opening_hours_array"
          :timezone="tribe.timezone"
          :opening-soon="openingSoon"
        />
        <span
          v-if="distanceMiles !== null"
          class="text-xs font-medium text-muted"
        >
          {{ distanceMiles < 10 ? distanceMiles.toFixed(1) : Math.round(distanceMiles) }} mi
        </span>
      </div>

      <h3 class="heading-display text-xl leading-snug text-brand-primary">
        <LocaleLink
          :href="href"
          class="hover:underline"
        >
          {{ shortName }}
        </LocaleLink>
      </h3>

      <p class="flex gap-2 text-sm leading-relaxed text-muted">
        <IconMapPin class="mt-0.5 size-4 shrink-0 text-brand-accent" />
        <span>
          {{ [tribe.address_1, tribe.address_2].filter(Boolean).join(', ') }}<br />
          {{ tribe.locality }}, {{ tribe.state_abbreviated }} {{ tribe.postal_code }}
        </span>
      </p>

      <div class="mt-auto flex flex-wrap gap-2 pt-2 text-sm font-semibold">
        <template v-if="!openingSoon">
          <LocaleLink
            :href="`${pagePath('menu')}?cafe=${tribe.slug}`"
            class="rounded-full bg-brand-accent px-4 py-2 text-brand-on-accent hover:bg-brand-accent-600"
          >
            {{ t('Order', 'Order') }}
          </LocaleLink>
          <LocaleLink
            :href="`${pagePath('book')}?cafe=${tribe.slug}`"
            class="rounded-full border border-brand-tint-strong px-4 py-2 text-brand-primary hover:bg-brand-tint"
          >
            {{ t('Book', 'Book') }}
          </LocaleLink>
        </template>
        <LocaleLink
          :href="href"
          class="rounded-full px-3 py-2 text-brand-primary hover:bg-brand-tint"
        >
          {{ t('Cafe page', 'Cafe page') }} →
        </LocaleLink>
      </div>
    </div>
  </article>
</template>
