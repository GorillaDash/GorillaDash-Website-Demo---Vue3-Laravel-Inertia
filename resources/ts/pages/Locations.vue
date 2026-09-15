<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import IconSearch from '@/components/icons/IconSearch.vue'
import TribeCard from '@/components/tribe/TribeCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import { useTribes, type TribeSummary } from '@/composables/useTribes'
import { STRUCTURE } from '@/constants/structure'
import { photo } from '@/lib/demoImagery'
import { mapEmbedUrl, milesBetween } from '@/lib/geo'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''

const { pagePath } = usePagePaths()
const { all, trading, openingSoon, loading } = useTribes()

const query = ref('')
const origin = ref<{ lat: number; lng: number } | null>(null)
const locating = ref(false)
const locateError = ref('')
const selectedSlug = ref<string | null>(null)

const distanceTo = (tribe: TribeSummary): number | null =>
  origin.value && tribe.latitude && tribe.longitude
    ? milesBetween(origin.value, { lat: Number(tribe.latitude), lng: Number(tribe.longitude) })
    : null

const matches = (tribe: TribeSummary, text: string): boolean => {
  const needle = text.trim().toLowerCase()
  if (!needle) {
    return true
  }

  return [tribe.name, tribe.locality, tribe.state, tribe.state_abbreviated, tribe.postal_code]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle))
}

const results = computed(() =>
  trading.value
    .filter((tribe) => matches(tribe, query.value))
    .map((tribe) => ({ tribe, distance: distanceTo(tribe) }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
)

const resultCount = computed(() =>
  t.value('locations.count', '{count, plural, one {# cafe} other {# cafes}}', {
    count: results.value.length
  })
)

const selected = computed(
  () =>
    all.value.find((tribe) => tribe.slug === selectedSlug.value) ?? results.value[0]?.tribe ?? null
)

const states = computed(() =>
  [...new Set(trading.value.map((tribe) => tribe.state).filter(Boolean) as string[])].sort()
)

const useMyLocation = () => {
  if (!('geolocation' in navigator)) {
    locateError.value = t.value(
      'locations.noGeolocation',
      'Your browser cannot share your location'
    )
    return
  }
  locating.value = true
  locateError.value = ''
  navigator.geolocation.getCurrentPosition(
    (position) => {
      origin.value = { lat: position.coords.latitude, lng: position.coords.longitude }
      query.value = ''
      locating.value = false
      selectedSlug.value = null
    },
    () => {
      locating.value = false
      locateError.value = t.value(
        'locations.locationDenied',
        'We could not get your location. Try searching instead'
      )
    },
    { timeout: 8000 }
  )
}
</script>

<template>
  <div>
    <SeoHead
      :title="page?.meta_title ?? ''"
      :description="page?.meta_description ?? ''"
    />

    <PageHero
      :title="field('Hero Heading')"
      :subtitle="field('Hero Subheading')"
      :image="photo('storefrontPatio', 1800)"
      detail='websitePage(slug: "locations")'
    >
      <form
        class="flex max-w-2xl flex-col gap-3 sm:flex-row"
        role="search"
        @submit.prevent
      >
        <label class="relative flex-1">
          <span class="sr-only">{{
            t('Search by city, state or ZIP', 'Search by city, state or ZIP')
          }}</span>
          <IconSearch class="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            v-model="query"
            type="search"
            :placeholder="t('City, state or ZIP code', 'City, state or ZIP code')"
            class="w-full rounded-full border-0 bg-white py-4 pr-4 pl-12 text-ink shadow-sm focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <AppButton
          size="lg"
          :disabled="locating"
          @click="useMyLocation"
        >
          {{ locating ? t('Locating…', 'Locating…') : t('Use my location', 'Use my location') }}
        </AppButton>
      </form>
      <p
        v-if="locateError"
        class="mt-3 text-sm text-brand-tint-strong"
      >
        {{ locateError }}
      </p>
      <div class="mt-6 flex flex-wrap gap-2">
        <button
          v-for="state in states"
          :key="state"
          type="button"
          class="rounded-full border border-white/30 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
          :class="query === state && 'bg-white text-brand-primary hover:bg-white'"
          @click="query = query === state ? '' : state"
        >
          {{ state }}
        </button>
      </div>
    </PageHero>

    <CmsBlock
      :info="STRUCTURE.tribeFinder"
      as="section"
      class="container py-12"
    >
      <div class="grid gap-8 lg:grid-cols-12">
        <div class="lg:col-span-7">
          <p class="mb-5 text-sm text-muted">
            <template v-if="loading && !all.length">{{
              t('Loading cafes…', 'Loading cafes…')
            }}</template>
            <template v-else>
              {{ resultCount }}
              <span v-if="origin">· {{ t('nearest first', 'nearest first') }}</span>
            </template>
          </p>

          <div class="grid gap-4">
            <TribeCard
              v-for="result in results"
              :key="result.tribe.slug"
              :tribe="result.tribe"
              :distance-miles="result.distance"
              :selected="selected?.slug === result.tribe.slug"
              compact
              @select="selectedSlug = $event"
            />
          </div>

          <div
            v-if="!loading && !results.length"
            class="rounded-card border border-dashed border-brand-tint-strong p-10 text-center"
          >
            <p class="heading-display text-2xl text-brand-primary">
              {{ t('No cafes match that search yet', 'No cafes match that search yet') }}
            </p>
            <p class="mt-2 text-muted">
              {{
                t(
                  'locations.empty',
                  'Try another city, or bring Juniper Table to your neighborhood.'
                )
              }}
            </p>
            <AppButton
              :href="pagePath('franchise')"
              variant="dark"
              class="mt-6"
            >
              {{ t('Own a franchise', 'Own a franchise') }}
            </AppButton>
          </div>
        </div>

        <aside class="lg:col-span-5">
          <div
            class="sticky top-36 overflow-hidden rounded-card border border-brand-tint-strong bg-white"
          >
            <iframe
              v-if="selected?.latitude && selected?.longitude"
              :key="selected.slug"
              :src="mapEmbedUrl(selected.latitude, selected.longitude, 13)"
              :title="t('locations.mapTitle', 'Map of {name}', { name: selected.name })"
              class="aspect-4/5 w-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
            <div
              v-if="selected"
              class="border-t border-brand-tint-strong p-4 text-sm"
            >
              <p class="font-semibold text-brand-primary">{{ selected.name }}</p>
              <p class="text-muted">
                {{ selected.address_1 }}, {{ selected.locality }}, {{ selected.state_abbreviated }}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </CmsBlock>

    <section
      v-if="openingSoon.length"
      class="bg-brand-tint py-16"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Coming to your city', 'Coming to your city')"
          :title="field('Opening Soon Heading') || t('Opening soon', 'Opening soon')"
        >
          <template #action>
            <AppButton
              :href="pagePath('franchise')"
              variant="dark"
            >
              {{ t('Open one in your city', 'Open one in your city') }}
            </AppButton>
          </template>
        </SectionHeader>
        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <TribeCard
            v-for="tribe in openingSoon"
            :key="tribe.slug"
            :tribe="tribe"
            compact
          />
        </div>
      </div>
    </section>
  </div>
</template>
