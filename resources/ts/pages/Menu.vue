<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import MenuCard from '@/components/menu/MenuCard.vue'
import CafePicker from '@/components/order/CafePicker.vue'
import CartSummary from '@/components/order/CartSummary.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { useCart } from '@/composables/useCart'
import { useTribes } from '@/composables/useTribes'
import { usePagePaths } from '@/composables/usePagePaths'
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
const { sections, loading } = useFoodMenuService('Website Menu')
const { slug: boundSlug } = useBoundLocation()
const { cafeSlug, count, loaded, init, clearCafe } = useCart()
const { trading } = useTribes()

// A cafe from the URL or an old visit that no longer takes orders is forgotten, as long
// as nothing is in the cart for it.
watch([trading, loaded], () => {
  if (
    trading.value.length &&
    loaded.value &&
    cafeSlug.value &&
    count.value === 0 &&
    !trading.value.some((tribe) => tribe.slug === cafeSlug.value)
  ) {
    clearCafe()
  }
})

const hasSections = computed(() => sections.value.length > 0)

onMounted(() => {
  const requested = new URLSearchParams(window.location.search).get('cafe')
  void init(requested ?? boundSlug.value, requested !== null)
})
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
      :image="photo('brunchSpread', 1800)"
      detail='websitePage(slug: "menu")'
    >
      <CafePicker inverted />
    </PageHero>

    <div class="sticky top-28 z-30 border-b border-brand-tint-strong bg-surface/95 backdrop-blur">
      <nav
        class="container flex gap-1 overflow-x-auto py-2"
        :aria-label="t('Menu sections', 'Menu sections')"
      >
        <a
          v-for="section in sections"
          :key="section.slug"
          :href="`#${section.slug}`"
          class="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-primary hover:bg-brand-tint"
        >
          {{ section.name }}
        </a>
      </nav>
    </div>

    <div class="container grid gap-10 py-12 lg:grid-cols-12">
      <CmsBlock
        :info="STRUCTURE.foodMenu"
        class="lg:col-span-8"
      >
        <template v-if="!hasSections && loading">
          <div class="grid gap-6 sm:grid-cols-2">
            <div
              v-for="index in 4"
              :key="index"
              class="h-96 animate-pulse rounded-card bg-brand-tint"
            />
          </div>
        </template>

        <section
          v-for="section in sections"
          :id="section.slug"
          :key="section.slug"
          class="mb-14 scroll-mt-44"
        >
          <h2 class="heading-display text-3xl text-brand-primary">{{ section.name }}</h2>
          <p class="mt-1 text-muted">{{ section.description }}</p>
          <div class="mt-6 grid gap-6 sm:grid-cols-2">
            <MenuCard
              v-for="card in section.cards"
              :key="card.id"
              :card="card"
            />
          </div>
        </section>

        <div class="rounded-card bg-brand-primary p-8 text-white">
          <h2 class="heading-display text-3xl">{{ field('Catering Banner Heading') }}</h2>
          <p class="mt-2 text-white/80">{{ field('Catering Banner Text') }}</p>
          <AppButton
            :href="pagePath('catering')"
            class="mt-5"
          >
            {{ t('See the catering menu', 'See the catering menu') }}
          </AppButton>
        </div>
      </CmsBlock>

      <aside class="lg:col-span-4">
        <div class="sticky top-44">
          <CartSummary />
        </div>
      </aside>
    </div>
  </div>
</template>
