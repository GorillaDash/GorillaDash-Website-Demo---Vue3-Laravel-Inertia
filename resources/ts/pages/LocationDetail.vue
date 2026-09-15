<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSharedProps } from '@/composables/useSharedProps'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocationHero from '@/components/location/LocationHero.vue'
import { getTribe, type TelephoneUrlTriggerType } from '@/api/tribes'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { bindBoundLocation } from '@/lib/boundLocation'
import { getValueByName } from '@/services/websiteContentValue'
import type { StoreLocation } from '@/constants/locations'
import type { LocationDetailContent } from '@/types/locations'

const { t } = useTranslate()

const defaultMetaTitleTemplate = (tribeName: string) =>
  t.value(
    'locationDetail.metaTitle',
    'Location | {tribeName} - Acme Diner | Mediterranean Food | Restaurant & Catering',
    { tribeName }
  )
const defaultMetaDescriptionTemplate = (tribeName: string) =>
  t.value(
    'locationDetail.metaDescription',
    'Menu for Acme Diner® in {tribeName}. Explore latest menu with photos and reviews.',
    { tribeName }
  )
const defaultIntroductionTemplate = (tribeName: string) =>
  t.value(
    'locationDetail.introduction',
    'At Acme Diner {tribeName}, we’re passionate about timeless flavors and legendary service. Our delicious Mediterranean dishes are created daily from classic family recipes with fresh, authentic ingredients. Stop by today or order online for pickup or delivery!',
    { tribeName }
  )
const defaultPageHeadingTemplate = (tribeName: string) => `Acme Diner ${tribeName}`

// No defineOptions({ layout }) → the default AppLayout applies. This page fetches the
// FULL tribe for its richer content (hours, map, ordering, SEO meta); the basics
// (name/address/phone) fall back to the `boundLocation` share prop when it already
// holds this store (e.g. a return visit) so they paint instantly instead of waiting
// on getTribe.
// useSharedProps, not usePage: under SSR the slug would otherwise be readable as another
// concurrent request's slug, and this page would render a different store.
const { props } = useSharedProps()
const slug = computed(() => (props.value.slug as string | undefined) ?? '')
const { result } = getTribe(slug)
const tribe = computed(() => result.value?.tribe ?? null)

const boundLocation = useBoundLocation()

// Lock this store site-wide. The GET render is a pure read so the edge can cache it —
// the binding is a cookie the browser writes here, after mount, followed by a partial
// reload of `boundLocation` so the header chip updates. A revisit to a store already
// bound writes nothing and reloads nothing.
onMounted(() => {
  bindBoundLocation(slug.value)
})

// Prefer the fresh tribe once it arrives, but fall back to the instant share prop so
// name/address render immediately (esp. on SPA navigation, where getTribe round-trips).
const name = computed(() => tribe.value?.name ?? boundLocation.name.value ?? '')
const addressLine1 = computed(
  () => tribe.value?.address_1 ?? boundLocation.address.value.address_1 ?? ''
)
const addressLine2 = computed(
  () => tribe.value?.address_2 ?? boundLocation.address.value.address_2 ?? ''
)

// Ad-source number swapping: a URL param (e.g. ?gclid=…) matching a trigger swaps in
// a tracking number. Client-only — it reads window.location.search.
const phone = computed(() => {
  const triggers = tribe.value?.telephone_url_triggers as TelephoneUrlTriggerType[] | null
  if (!import.meta.env.SSR && triggers && triggers.length > 0) {
    const params = new URLSearchParams(window.location.search)
    const match = triggers.find((trigger) => {
      const value = params.get(trigger.name)
      return value != null && value !== '' && value === String(trigger.value)
    })
    if (match) {
      return match.number
    }
  }
  return tribe.value?.organic_number ?? tribe.value?.main_telephone ?? null
})

const googleMapUrl = computed(() => {
  const current = tribe.value
  if (current?.latitude && current?.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${current.latitude},${current.longitude}&query_place_id=${current.google_place_id}`
  }
  return null
})

// opening_hours is a JSON scalar (typed `unknown` by codegen) — guard + narrow it.
const openingHours = computed(() => {
  const raw = tribe.value?.opening_hours
  return Array.isArray(raw)
    ? (raw as Array<{ day: string; open: string | null; close: string | null }>)
    : []
})

// Basics (name/address/phone) come from the share prop; the rest (description, hours,
// map, ordering) only exists on the full tribe, so it fills in when getTribe resolves.
// services is still mock content — move it onto the CMS when that lands.
const location = computed<LocationDetailContent>(() => ({
  name: name.value,
  services: ['delivery', 'pickup', 'dine-in', 'catering'],
  description: tribe.value?.introduction ?? defaultIntroductionTemplate(name.value),
  addressLines: [addressLine1.value, addressLine2.value].filter((line) => Boolean(line)),
  phone: phone.value ?? boundLocation.phone.value ?? '(561) 420-0626',
  directionsHref: googleMapUrl.value ?? '#',
  hours: openingHours.value
    .filter((hour) => hour.open && hour.close)
    .map((hour) => ({
      day: hour.day,
      hours: `${hour.open ?? ''} - ${hour.close ?? ''}`
    })),
  orderHref: getValueByName('Online Ordering URL', tribe.value) ?? '#'
}))

// The marker for the hero map. Identity comes from the share prop; the geo (lat/lng)
// only exists on the full tribe, so the marker positions once getTribe resolves.
const store = computed<StoreLocation>(() => ({
  id: tribe.value?.slug ?? boundLocation.slug.value ?? '',
  name: name.value,
  distanceMi: 0,
  addressLine1: addressLine1.value,
  addressLine2: addressLine2.value,
  lat: Number(tribe.value?.latitude ?? 0),
  lng: Number(tribe.value?.longitude ?? 0)
}))

const metaTitle = computed(() => tribe.value?.meta_title ?? defaultMetaTitleTemplate(name.value))
const metaDescription = computed(
  () => tribe.value?.meta_description ?? defaultMetaDescriptionTemplate(name.value)
)
</script>

<template>
  <div>
    <SeoHead
      :title="metaTitle"
      :description="metaDescription"
    />

    <LocationHero
      :content="location"
      :store="store"
    />
  </div>
</template>
