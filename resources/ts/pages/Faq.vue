<script setup lang="ts">
import { computed } from 'vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import PageHero from '@/components/ui/PageHero.vue'
import { getFaqs } from '@/api/faq'
import { photo } from '@/lib/demoImagery'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''

const { result } = getFaqs()
const categories = computed(() =>
  [...(result.value?.websiteFaqCategory ?? [])]
    .filter((category) => category !== null)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
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
      :image="photo('latteFlatLay', 1800)"
      detail='websitePage(slug: "faq")'
    />
    <CmsBlock
      :info="{
        module: 'Website FAQ',
        query: 'websiteFaqCategory { website_faqs }',
        edit: 'Websites › FAQs',
        scope: 'Organisation'
      }"
      as="section"
      class="container max-w-4xl py-16"
    >
      <div
        v-for="category in categories"
        :key="category.name ?? undefined"
        class="mb-12"
      >
        <h2 class="heading-display text-3xl text-brand-primary">{{ category.name }}</h2>
        <div
          class="mt-5 divide-y divide-brand-tint-strong rounded-card border border-brand-tint-strong bg-white px-6"
        >
          <details
            v-for="faq in category.website_faqs ?? []"
            :key="faq?.slug ?? undefined"
            class="group py-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-brand-primary"
            >
              {{ faq?.question }}
              <span class="text-2xl transition group-open:rotate-45">+</span>
            </summary>
            <div
              class="mt-3 leading-relaxed text-muted"
              v-html="faq?.answer"
            />
          </details>
        </div>
      </div>
    </CmsBlock>
  </div>
</template>
