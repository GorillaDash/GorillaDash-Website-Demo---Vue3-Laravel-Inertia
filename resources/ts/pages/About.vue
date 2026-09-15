<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import { useTribes } from '@/composables/useTribes'
import { STRUCTURE } from '@/constants/structure'
import { photo } from '@/lib/demoImagery'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''
const { pagePath } = usePagePaths()
const { trading, states } = useTribes()

const values = computed(() =>
  [1, 2, 3].map((number) => ({
    title: field(`Value ${number} Title`),
    text: field(`Value ${number} Text`)
  }))
)
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
      :image="photo('interiorCounter', 1800)"
      detail='websitePage(slug: "about")'
    />

    <CmsBlock
      :info="STRUCTURE.page"
      detail='websitePage(slug: "about") · Story Body (Rich Text)'
      as="section"
      class="container grid items-center gap-12 py-16 lg:grid-cols-2"
    >
      <div>
        <h2 class="heading-display text-4xl text-brand-primary">{{ field('Story Heading') }}</h2>
        <div
          class="mt-6 space-y-4 text-lg leading-relaxed text-ink"
          v-html="field('Story Body')"
        />
        <p class="mt-6 text-muted">
          {{
            t('about.today', 'Today: {cafes} cafes in {states} states.', {
              cafes: trading.length,
              states
            })
          }}
        </p>
      </div>
      <SmartImage
        :src="photo('ownerCounter', 1200)"
        alt="An owner behind the counter of her cafe"
        class="aspect-4/5 w-full rounded-card"
      />
    </CmsBlock>

    <section class="bg-brand-tint py-16">
      <div class="container grid gap-6 md:grid-cols-3">
        <article
          v-for="value in values"
          :key="value.title"
          class="rounded-card bg-white p-8"
        >
          <h3 class="heading-display text-2xl text-brand-primary">{{ value.title }}</h3>
          <p class="mt-3 leading-relaxed text-muted">{{ value.text }}</p>
        </article>
      </div>
    </section>

    <section class="container flex flex-wrap items-center justify-between gap-6 py-16">
      <h2 class="heading-display text-3xl text-brand-primary">
        {{ t('about.cta', 'Come and eat with us.') }}
      </h2>
      <div class="flex gap-3">
        <AppButton :href="pagePath('locations')">{{ t('Find a cafe', 'Find a cafe') }}</AppButton>
        <AppButton
          :href="pagePath('franchise')"
          variant="outline"
          >{{ t('Own a franchise', 'Own a franchise') }}</AppButton
        >
      </div>
    </section>
  </div>
</template>
