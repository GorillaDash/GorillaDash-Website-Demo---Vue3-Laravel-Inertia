<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import MenuCard from '@/components/menu/MenuCard.vue'
import ReviewCard from '@/components/reviews/ReviewCard.vue'
import TribeOpenBadge from '@/components/tribe/TribeOpenBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import { getTribeOurWorks } from '@/api/ourWorks'
import { getReviews } from '@/api/reviews'
import { getTribe } from '@/api/tribes'
import { usePagePaths } from '@/composables/usePagePaths'
import { STRUCTURE } from '@/constants/structure'
import { bindBoundLocation } from '@/lib/boundLocation'
import { personPhoto, tribePhoto } from '@/lib/demoImagery'
import { directionsUrl, mapEmbedUrl } from '@/lib/geo'
import type { JsonLd } from '@/lib/seo'
import { useFoodMenuService } from '@/services/foodMenuService'
import { todayName, weekHours } from '@/services/tribeHoursService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { pagePath, cmsRoute } = usePagePaths()

const { result, loading } = getTribe(() => props.slug)
const tribe = computed(() => result.value?.tribe ?? null)

const openingSoon = computed(() => tribe.value?.status === 'Opening Soon')
const shortName = computed(() => (tribe.value?.name ?? '').replace(/^Hungry Gorilla\s+/i, ''))
const hours = computed(() => weekHours(tribe.value?.opening_hours_array))
const today = ref<string | null>(null)

const { result: workResult } = getTribeOurWorks(() => props.slug)
const work = computed(() => workResult.value?.ourWorks?.data ?? [])

const { result: reviewResult } = getReviews(() => ({ tribeSlug: props.slug, count: 12 }))
const reviews = computed(() =>
  (reviewResult.value?.reviews ?? []).filter((review) => review !== null)
)
const averageRating = computed(() =>
  reviews.value.length
    ? reviews.value.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.value.length
    : 0
)

const team = computed(() => (tribe.value?.teamMembers ?? []).filter((member) => member !== null))

const { sections } = useFoodMenuService('Website Menu')
const menuHighlights = computed(() =>
  sections.value
    .map((section) => section.cards[0])
    .filter((card) => card !== undefined)
    .slice(0, 4)
)

const orderHref = computed(() => `${pagePath('menu')}?cafe=${props.slug}`)
const bookHref = computed(() => `${pagePath('book')}?cafe=${props.slug}`)

const anchors = computed(() =>
  [
    { id: 'about', label: t.value('About', 'About') },
    { id: 'menu', label: t.value('Menu', 'Menu'), hidden: openingSoon.value },
    { id: 'our-work', label: t.value('Our work', 'Our work'), hidden: !work.value.length },
    { id: 'team', label: t.value('Team', 'Team'), hidden: !team.value.length },
    { id: 'reviews', label: t.value('Reviews', 'Reviews'), hidden: !reviews.value.length }
  ].filter((anchor) => !anchor.hidden)
)

const jsonLd = computed<JsonLd | null>(() => {
  const value = tribe.value
  if (!value) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: value.name,
    telephone: value.main_telephone ?? undefined,
    email: value.public_email ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [value.address_1, value.address_2].filter(Boolean).join(', '),
      addressLocality: value.locality ?? undefined,
      addressRegion: value.state_abbreviated ?? undefined,
      postalCode: value.postal_code ?? undefined,
      addressCountry: 'US'
    },
    geo: value.latitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: Number(value.latitude),
          longitude: Number(value.longitude)
        }
      : undefined
  } as JsonLd
})

// Bind on mount as well as on change: after SSR the tribe arrives from the restored
// Apollo cache during setup, so the watcher below never fires on a hard load.
onMounted(() => {
  today.value = todayName(tribe.value?.timezone)
  if (tribe.value?.status === 'Active') {
    bindBoundLocation(tribe.value.slug)
  }
})

watch(tribe, (value) => {
  if (value) {
    today.value = todayName(value.timezone)
    if (value.status === 'Active') {
      bindBoundLocation(value.slug)
    }
  }
})
</script>

<template>
  <div>
    <SeoHead
      :title="tribe?.meta_title ?? tribe?.name ?? ''"
      :description="tribe?.meta_description ?? ''"
      :json-ld="jsonLd"
    />

    <nav
      class="border-b border-brand-tint-strong bg-white"
      :aria-label="t('Breadcrumb', 'Breadcrumb')"
    >
      <ol class="container flex items-center gap-2 py-3 text-sm text-muted">
        <li>
          <LocaleLink
            href="/"
            class="hover:text-brand-primary"
            >{{ t('Home', 'Home') }}</LocaleLink
          >
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <LocaleLink
            :href="pagePath('locations')"
            class="hover:text-brand-primary"
            >{{ t('Locations', 'Locations') }}</LocaleLink
          >
        </li>
        <li aria-hidden="true">/</li>
        <li class="font-medium text-brand-primary">{{ shortName }}</li>
      </ol>
    </nav>

    <!-- Hero -->
    <CmsBlock
      :info="STRUCTURE.tribeDetails"
      :detail="`tribe(slug: &quot;${slug}&quot;, status: &quot;active&quot;)`"
      as="section"
      class="container grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:py-16"
    >
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <TribeOpenBadge
            v-if="tribe"
            :hours="tribe.opening_hours_array"
            :timezone="tribe.timezone"
            :opening-soon="openingSoon"
          />
          <span
            v-if="averageRating"
            class="inline-flex items-center gap-2 text-sm text-muted"
          >
            <StarRating :rating="averageRating" />
            {{ averageRating.toFixed(1) }} · {{ reviews.length }} {{ t('reviews', 'reviews') }}
          </span>
        </div>

        <h1
          class="mt-5 heading-display text-4xl leading-tight text-brand-primary sm:text-5xl lg:text-6xl"
        >
          <span
            v-if="loading && !tribe"
            class="block h-14 w-3/4 animate-pulse rounded bg-brand-tint"
          />
          {{ tribe?.heading || tribe?.name }}
        </h1>
        <p
          v-if="tribe?.sub_heading"
          class="mt-3 text-xl text-muted"
        >
          {{ tribe.sub_heading }}
        </p>

        <address
          v-if="tribe"
          class="mt-6 flex flex-col gap-2 text-base not-italic"
        >
          <span class="flex gap-2">
            <IconMapPin class="mt-1 size-4 shrink-0 text-brand-accent" />
            {{ [tribe.address_1, tribe.address_2].filter(Boolean).join(', ') }},
            {{ tribe.locality }}, {{ tribe.state_abbreviated }} {{ tribe.postal_code }}
          </span>
          <a
            v-if="tribe.main_telephone"
            :href="`tel:${tribe.main_telephone}`"
            class="font-semibold text-brand-primary hover:underline"
          >
            {{ tribe.main_telephone }}
          </a>
          <a
            v-if="tribe.public_email"
            :href="`mailto:${tribe.public_email}`"
            class="text-muted hover:underline"
          >
            {{ tribe.public_email }}
          </a>
        </address>

        <div class="mt-8 flex flex-wrap gap-3">
          <template v-if="!openingSoon">
            <AppButton
              :href="orderHref"
              size="lg"
            >
              {{ t('Order from this cafe', 'Order from this cafe') }}
            </AppButton>
            <AppButton
              :href="bookHref"
              variant="dark"
              size="lg"
            >
              {{ t('Book a tasting', 'Book a tasting') }}
            </AppButton>
          </template>
          <AppButton
            v-else
            :href="`${pagePath('contact')}?cafe=${slug}`"
            size="lg"
          >
            {{ t('Ask about catering', 'Ask about catering') }}
          </AppButton>
          <AppButton
            v-if="tribe?.latitude && tribe?.longitude"
            :href="directionsUrl(tribe.latitude, tribe.longitude)"
            variant="outline"
            size="lg"
            external
          >
            {{ t('Directions', 'Directions') }}
          </AppButton>
        </div>
      </div>

      <div class="relative">
        <SmartImage
          :src="tribePhoto(slug)"
          :alt="tribe?.name ?? ''"
          eager
          class="aspect-4/3 w-full rounded-(--radius-card)"
        />
        <div
          v-if="openingSoon"
          class="absolute inset-x-6 bottom-6 rounded-2xl bg-brand-primary/90 p-5 text-white backdrop-blur"
        >
          <p class="heading-display text-2xl">{{ tribe?.sub_heading }}</p>
          <p class="mt-1 text-sm text-white/80">
            {{ t('Catering enquiries are open now.', 'Catering enquiries are open now.') }}
          </p>
        </div>
      </div>
    </CmsBlock>

    <!-- In-page navigation -->
    <div class="sticky top-28 z-30 border-y border-brand-tint-strong bg-surface/95 backdrop-blur">
      <nav
        class="container flex gap-1 overflow-x-auto py-2"
        :aria-label="t('On this page', 'On this page')"
      >
        <a
          v-for="anchor in anchors"
          :key="anchor.id"
          :href="`#${anchor.id}`"
          class="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-primary hover:bg-brand-tint"
        >
          {{ anchor.label }}
        </a>
      </nav>
    </div>

    <!-- About + hours -->
    <CmsBlock
      id="about"
      :info="STRUCTURE.tribeDetails"
      :detail="`tribe(slug) { introduction opening_hours_array }`"
      as="section"
      class="container grid scroll-mt-44 gap-10 py-16 lg:grid-cols-12"
    >
      <div class="lg:col-span-7">
        <SectionHeader
          :eyebrow="t('About this cafe', 'About this cafe')"
          :title="t('locationDetail.aboutTitle', 'Welcome to {name}', { name: shortName })"
        />
        <p class="mt-6 text-lg leading-relaxed text-ink">{{ tribe?.introduction }}</p>
        <div
          v-if="tribe?.latitude && tribe?.longitude"
          class="mt-8 overflow-hidden rounded-card border border-brand-tint-strong"
        >
          <iframe
            :src="mapEmbedUrl(tribe.latitude, tribe.longitude, 15)"
            :title="t('locations.mapTitle', 'Map of {name}', { name: tribe.name })"
            class="aspect-video w-full border-0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div class="lg:col-span-5">
        <div class="rounded-(--radius-card) border border-brand-tint-strong bg-white p-6">
          <h2 class="heading-display text-2xl text-brand-primary">
            {{ t('Opening hours', 'Opening hours') }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{
              t('locationDetail.timezone', 'Local time ({zone})', { zone: tribe?.timezone ?? '' })
            }}
          </p>
          <dl class="mt-5 divide-y divide-brand-tint">
            <div
              v-for="day in hours"
              :key="day.day"
              class="flex justify-between py-2.5 text-sm"
              :class="today === day.day && 'font-semibold text-brand-primary'"
            >
              <dt>
                {{ day.day }}
                <span
                  v-if="today === day.day"
                  class="ml-2 rounded-full bg-brand-accent px-2 py-0.5 text-xs text-brand-on-accent"
                  >{{ t('Today', 'Today') }}</span
                >
              </dt>
              <dd :class="day.slots.length ? '' : 'text-muted'">{{ day.label }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </CmsBlock>

    <!-- Menu -->
    <CmsBlock
      v-if="!openingSoon"
      id="menu"
      :info="STRUCTURE.foodMenu"
      :detail="`foodMenu(name: &quot;Website Menu&quot;) · priced for ${slug}`"
      as="section"
      class="scroll-mt-44 bg-brand-tint py-16"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Order ahead', 'Order ahead')"
          :title="t('locationDetail.menuTitle', 'Order from {name}', { name: shortName })"
        >
          <template #action>
            <AppButton
              :href="orderHref"
              variant="dark"
            >
              {{ t('Full menu', 'Full menu') }}
            </AppButton>
          </template>
        </SectionHeader>
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MenuCard
            v-for="card in menuHighlights"
            :key="card.id"
            :card="card"
          />
        </div>
      </div>
    </CmsBlock>

    <!-- Our work -->
    <CmsBlock
      v-if="work.length"
      id="our-work"
      :info="STRUCTURE.tribeOurWork"
      :detail="`ourWorks(tribe_slug: &quot;${slug}&quot;)`"
      as="section"
      class="container scroll-mt-44 py-16"
    >
      <SectionHeader
        :eyebrow="t('Our work', 'Our work')"
        :title="t('locationDetail.workTitle', 'Catered by {name}', { name: shortName })"
      />
      <div class="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <WorkCard
          v-for="post in work"
          :key="post.slug ?? post.heading ?? undefined"
          :post="post"
          :linked="false"
        />
      </div>
    </CmsBlock>

    <!-- Team -->
    <CmsBlock
      v-if="team.length"
      id="team"
      :info="STRUCTURE.tribeTeam"
      as="section"
      class="scroll-mt-44 border-t border-brand-tint-strong bg-white py-16"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Team', 'Team')"
          :title="t('locationDetail.teamTitle', 'Meet the team')"
        />
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="member in team"
            :key="`${member.first_name}-${member.last_name}`"
            class="flex flex-col"
          >
            <SmartImage
              :src="member.avatar || personPhoto(`${member.first_name}${member.last_name}`)"
              :alt="`${member.first_name} ${member.last_name}`"
              class="aspect-square w-full rounded-(--radius-card)"
            />
            <h3 class="mt-4 heading-display text-xl text-brand-primary">
              {{ member.first_name }} {{ member.last_name }}
            </h3>
            <p class="text-sm font-semibold text-brand-accent">{{ member.role }}</p>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ member.about }}</p>
          </article>
        </div>
      </div>
    </CmsBlock>

    <!-- Reviews -->
    <CmsBlock
      v-if="reviews.length"
      id="reviews"
      :info="STRUCTURE.tribeReviews"
      :detail="`reviews(tribe_slug: &quot;${slug}&quot;)`"
      as="section"
      class="container scroll-mt-44 py-16"
    >
      <SectionHeader
        :eyebrow="t('Reviews', 'Reviews')"
        :title="
          t('locationDetail.reviewsTitle', '{rating} out of 5 from {count} guests', {
            rating: averageRating.toFixed(1),
            count: reviews.length
          })
        "
      />
      <div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReviewCard
          v-for="review in reviews"
          :key="review.id ?? undefined"
          :review="review"
          :show-tribe="false"
        />
      </div>
    </CmsBlock>

    <!-- CTA -->
    <section class="container pb-16">
      <div
        class="flex flex-col items-start justify-between gap-6 rounded-card bg-brand-primary p-10 text-white sm:flex-row sm:items-center"
      >
        <div>
          <h2 class="heading-display text-3xl">
            {{
              t('locationDetail.ctaTitle', 'Planning an event near {city}?', {
                city: tribe?.locality ?? ''
              })
            }}
          </h2>
          <p class="mt-2 text-white/80">
            {{
              t(
                'locationDetail.ctaText',
                'Book a free catering consultation with this cafe’s team.'
              )
            }}
          </p>
        </div>
        <AppButton
          :href="openingSoon ? `${pagePath('contact')}?cafe=${slug}` : bookHref"
          size="lg"
        >
          {{
            openingSoon
              ? t('Get in touch', 'Get in touch')
              : t('Book a consultation', 'Book a consultation')
          }}
        </AppButton>
      </div>
      <p class="mt-6 text-sm text-muted">
        <LocaleLink
          :href="pagePath('locations')"
          class="hover:underline"
          >← {{ t('All locations', 'All locations') }}</LocaleLink
        >
      </p>
    </section>
  </div>
</template>
