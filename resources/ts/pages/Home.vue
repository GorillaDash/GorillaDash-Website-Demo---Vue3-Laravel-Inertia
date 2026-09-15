<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import ArticleCard from '@/components/journal/ArticleCard.vue'
import MenuCard from '@/components/menu/MenuCard.vue'
import ReviewCard from '@/components/reviews/ReviewCard.vue'
import TribeCard from '@/components/tribe/TribeCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import { getArticlesByCategories } from '@/api/article'
import { getOrganisationOurWorks } from '@/api/ourWorks'
import { getReviews } from '@/api/reviews'
import { usePagePaths } from '@/composables/usePagePaths'
import { useTribes } from '@/composables/useTribes'
import { STRUCTURE } from '@/constants/structure'
import { photo } from '@/lib/demoImagery'
import { useFoodMenuService } from '@/services/foodMenuService'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''

const { pagePath } = usePagePaths()
const { trading, openingSoon, states } = useTribes()

const { sections } = useFoodMenuService('Website Menu')
const featuredMenu = computed(() =>
  sections.value
    .map((section) => section.cards[0])
    .filter((card) => card !== undefined)
    .slice(0, 4)
)

const { result: workResult } = getOrganisationOurWorks({ page: 1, itemsPerPage: 3, featured: true })
const featuredWork = computed(() => workResult.value?.organisationOurWorks?.data ?? [])

const { result: reviewResult } = getReviews({ featured: true, count: 30 })
const reviews = computed(() =>
  (reviewResult.value?.reviews ?? []).filter((review) => review !== null)
)
const averageRating = computed(() => {
  const ratings = reviews.value.map((review) => review.rating ?? 0).filter((rating) => rating > 0)

  return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
})

const articleVariables = ref({ categories: null, page: 1, itemsPerPage: 3 })
const { result: articleResult } = getArticlesByCategories(articleVariables)
const articles = computed(() => articleResult.value?.articlesPagination?.data ?? [])

const stats = computed(() => [
  {
    value: String(trading.value.length || '—'),
    label: t.value('home.stats.cafes', 'Cafes open today')
  },
  { value: String(states.value || '—'), label: t.value('home.stats.states', 'States') },
  {
    value: String(openingSoon.value.length || '—'),
    label: t.value('home.stats.soon', 'Opening soon')
  },
  {
    value: averageRating.value ? averageRating.value.toFixed(1) : '—',
    label: t.value('home.stats.rating', 'Average guest rating')
  }
])
</script>

<template>
  <div>
    <SeoHead
      :title="page?.meta_title ?? ''"
      :description="page?.meta_description ?? ''"
    />

    <!-- Hero -->
    <CmsBlock
      :info="STRUCTURE.page"
      detail='websitePage(slug: "homepage")'
      as="section"
      class="overflow-hidden"
    >
      <div class="container grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p class="mb-5 text-sm font-semibold tracking-widest text-brand-accent uppercase">
            {{ field('Hero Eyebrow') }}
          </p>
          <h1
            class="heading-display text-5xl leading-[1.05] text-brand-primary sm:text-6xl xl:text-7xl"
          >
            {{ field('Hero Heading') }}
            <span
              v-if="!page"
              class="block h-24 w-full animate-pulse rounded-xl bg-brand-tint"
            />
          </h1>
          <p class="mt-6 max-w-xl text-xl leading-relaxed text-muted">
            {{ field('Hero Subheading') }}
          </p>
          <div class="mt-9 flex flex-wrap gap-3">
            <AppButton
              :href="pagePath('menu')"
              size="lg"
            >
              {{ field('Hero Primary CTA Label') || t('Order online', 'Order online') }}
            </AppButton>
            <AppButton
              :href="pagePath('catering')"
              variant="outline"
              size="lg"
            >
              {{ field('Hero Secondary CTA Label') || t('Plan catering', 'Plan catering') }}
            </AppButton>
          </div>
        </div>

        <div class="relative">
          <div class="grid aspect-5/4 grid-cols-5 grid-rows-2 gap-3 sm:gap-4">
            <SmartImage
              :src="photo('heroBoard', 1100)"
              alt="A grazing board with cheeses, cured meats and fruit"
              eager
              class="col-span-3 row-span-2 size-full rounded-card"
            />
            <SmartImage
              :src="photo('latteLeaf', 600)"
              alt="A latte with leaf art"
              eager
              class="col-span-2 size-full rounded-card"
            />
            <SmartImage
              :src="photo('bowlSalad', 600)"
              alt="A grain bowl with vegetables"
              class="col-span-2 size-full rounded-card"
            />
          </div>

          <div
            class="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-brand-tint-strong sm:left-6 sm:px-5 sm:py-4"
          >
            <StarRating
              :rating="averageRating || 5"
              size="size-5"
            />
            <div class="text-sm">
              <p class="font-semibold text-brand-primary">
                {{ averageRating ? averageRating.toFixed(1) : '5.0' }}
                {{ t('from our guests', 'from our guests') }}
              </p>
              <p class="text-muted">
                {{ trading.length }} {{ t('cafes', 'cafes') }} · {{ states }}
                {{ t('states', 'states') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CmsBlock>

    <!-- Network stats -->
    <CmsBlock
      :info="STRUCTURE.networkStats"
      as="section"
      class="mt-6 border-y border-brand-tint-strong bg-brand-tint"
    >
      <dl class="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="text-center"
        >
          <dt class="order-2 text-sm text-muted">{{ stat.label }}</dt>
          <dd class="heading-display text-4xl text-brand-primary lg:text-5xl">{{ stat.value }}</dd>
        </div>
      </dl>
    </CmsBlock>

    <!-- Menu -->
    <CmsBlock
      :info="STRUCTURE.foodMenu"
      as="section"
      class="container py-20"
    >
      <SectionHeader
        :eyebrow="t('Order ahead', 'Order ahead')"
        :title="field('Menu Heading')"
        :caption="field('Menu Caption')"
      >
        <template #action>
          <AppButton
            :href="pagePath('menu')"
            variant="dark"
          >
            {{ t('See the full menu', 'See the full menu') }}
          </AppButton>
        </template>
      </SectionHeader>

      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MenuCard
          v-for="card in featuredMenu"
          :key="card.id"
          :card="card"
        />
        <template v-if="!featuredMenu.length">
          <div
            v-for="index in 4"
            :key="index"
            class="h-96 animate-pulse rounded-card bg-brand-tint"
          />
        </template>
      </div>
    </CmsBlock>

    <!-- Catering -->
    <CmsBlock
      :info="STRUCTURE.page"
      detail='websitePage(slug: "homepage") · Catering fields'
      as="section"
      class="bg-brand-primary text-white"
    >
      <div class="container grid items-center gap-12 py-20 lg:grid-cols-2">
        <div class="grid grid-cols-2 gap-4">
          <SmartImage
            :src="photo('cateringTable', 700)"
            alt="A catering table set for guests"
            class="aspect-3/4 w-full rounded-card"
          />
          <SmartImage
            :src="photo('miniSandwiches', 700)"
            alt="A tray of mini sandwiches"
            class="mt-12 aspect-3/4 w-full rounded-card"
          />
        </div>
        <div>
          <SectionHeader
            :eyebrow="t('Catering', 'Catering')"
            :title="field('Catering Heading')"
            :caption="field('Catering Caption')"
            inverted
          />
          <ul class="mt-8 grid gap-3 text-white/85 sm:grid-cols-2">
            <li
              v-for="point in [
                t(
                  'Boards and boxed lunches with 24 hours notice',
                  'Boards and boxed lunches with 24 hours notice'
                ),
                t('A named catering lead for every event', 'A named catering lead for every event'),
                t(
                  'Tastings for weddings and large events',
                  'Tastings for weddings and large events'
                ),
                t('Delivery and setup included', 'Delivery and setup included')
              ]"
              :key="point"
              class="flex gap-3"
            >
              <span class="mt-2 size-2 shrink-0 rounded-full bg-brand-accent" />
              {{ point }}
            </li>
          </ul>
          <div class="mt-10 flex flex-wrap gap-3">
            <AppButton
              :href="pagePath('book')"
              size="lg"
            >
              {{ field('Catering CTA Label') || t('Book a consultation', 'Book a consultation') }}
            </AppButton>
            <AppButton
              :href="pagePath('catering')"
              variant="light"
              size="lg"
            >
              {{ t('Catering menu', 'Catering menu') }}
            </AppButton>
          </div>
        </div>
      </div>
    </CmsBlock>

    <!-- Our Work -->
    <CmsBlock
      :info="STRUCTURE.organisationOurWork"
      as="section"
      class="container py-20"
    >
      <SectionHeader
        :eyebrow="t('Our work', 'Our work')"
        :title="field('Our Work Heading')"
        :caption="field('Our Work Caption')"
      >
        <template #action>
          <LocaleLink
            :href="pagePath('our-work')"
            class="font-semibold text-brand-primary underline-offset-4 hover:underline"
          >
            {{ t('See all events', 'See all events') }} →
          </LocaleLink>
        </template>
      </SectionHeader>
      <div class="mt-10 grid gap-8 md:grid-cols-3">
        <WorkCard
          v-for="post in featuredWork"
          :key="post.slug ?? post.heading ?? undefined"
          :post="post"
        />
      </div>
    </CmsBlock>

    <!-- Locations -->
    <CmsBlock
      :info="STRUCTURE.tribeFinder"
      as="section"
      class="bg-brand-tint py-20"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Locations', 'Locations')"
          :title="field('Locations Heading')"
          :caption="field('Locations Caption')"
        >
          <template #action>
            <AppButton
              :href="pagePath('locations')"
              variant="dark"
            >
              {{ t('Find your nearest cafe', 'Find your nearest cafe') }}
            </AppButton>
          </template>
        </SectionHeader>
        <div class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <TribeCard
            v-for="tribe in trading.slice(0, 4)"
            :key="tribe.slug"
            :tribe="tribe"
          />
        </div>
        <p
          v-if="openingSoon.length"
          class="mt-8 text-muted"
        >
          {{ t('Opening soon', 'Opening soon') }}:
          <span class="font-semibold text-brand-primary">{{
            openingSoon.map((tribe) => `${tribe.locality}, ${tribe.state_abbreviated}`).join(' · ')
          }}</span>
        </p>
      </div>
    </CmsBlock>

    <!-- Reviews -->
    <CmsBlock
      :info="STRUCTURE.reviews"
      as="section"
      class="container py-20"
    >
      <SectionHeader
        :eyebrow="t('Reviews', 'Reviews')"
        :title="field('Reviews Heading')"
        align="center"
      />
      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <ReviewCard
          v-for="review in reviews.slice(0, 3)"
          :key="review.id ?? undefined"
          :review="review"
        />
      </div>
    </CmsBlock>

    <!-- Franchise -->
    <CmsBlock
      :info="STRUCTURE.page"
      detail='websitePage(slug: "homepage") · Franchise fields'
      as="section"
      class="container pb-20"
    >
      <div class="relative overflow-hidden rounded-card bg-brand-primary text-white">
        <SmartImage
          :src="photo('teamKitchen', 1600)"
          alt=""
          class="absolute inset-0 size-full opacity-30"
        />
        <div
          class="absolute inset-0 bg-linear-to-r from-brand-primary via-brand-primary/85 to-transparent"
        />
        <div class="relative max-w-2xl p-10 sm:p-16">
          <p class="mb-4 text-sm font-semibold tracking-widest text-brand-tint-strong uppercase">
            {{ t('Franchise opportunities', 'Franchise opportunities') }}
          </p>
          <h2 class="heading-display text-4xl leading-tight sm:text-5xl">
            {{ field('Franchise Heading') }}
          </h2>
          <p class="mt-5 text-lg leading-relaxed text-white/85">{{ field('Franchise Caption') }}</p>
          <AppButton
            :href="pagePath('franchise')"
            size="lg"
            class="mt-8"
          >
            {{ field('Franchise CTA Label') || t('Explore franchising', 'Explore franchising') }}
          </AppButton>
        </div>
      </div>
    </CmsBlock>

    <!-- Journal -->
    <CmsBlock
      :info="STRUCTURE.articles"
      as="section"
      class="border-t border-brand-tint-strong bg-white py-20"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Journal', 'Journal')"
          :title="t('home.journal.title', 'From the journal')"
        >
          <template #action>
            <LocaleLink
              :href="pagePath('blog')"
              class="font-semibold text-brand-primary underline-offset-4 hover:underline"
            >
              {{ t('Read the journal', 'Read the journal') }} →
            </LocaleLink>
          </template>
        </SectionHeader>
        <div class="mt-10 grid gap-8 md:grid-cols-3">
          <ArticleCard
            v-for="article in articles"
            :key="article.slug ?? ''"
            :article="article"
          />
        </div>
      </div>
    </CmsBlock>
  </div>
</template>
