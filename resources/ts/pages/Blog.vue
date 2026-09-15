<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import ArticleCard from '@/components/journal/ArticleCard.vue'
import PageHero from '@/components/ui/PageHero.vue'
import { getArticleCategories, getArticlesByCategories } from '@/api/article'
import { STRUCTURE } from '@/constants/structure'
import { photo } from '@/lib/demoImagery'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''

const category = ref<string | null>(null)
const variables = ref({ categories: null as string[] | null, page: 1, itemsPerPage: 12 })
const { result, loading } = getArticlesByCategories(variables)
const articles = computed(() => result.value?.articlesPagination?.data ?? [])

const { result: categoryResult } = getArticleCategories()
const categories = computed(() =>
  (categoryResult.value?.articleCategories ?? []).filter((item) => item !== null)
)

const choose = (name: string | null) => {
  category.value = name
  variables.value = { ...variables.value, categories: name ? [name] : null }
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
      :image="photo('latteArt', 1800)"
      detail='websitePage(slug: "blog")'
    />
    <CmsBlock
      :info="STRUCTURE.articles"
      detail="articleCategories · articlesPagination(categories)"
      as="section"
      class="container py-14"
    >
      <div
        class="flex flex-wrap gap-2"
        role="tablist"
      >
        <button
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-medium"
          :class="
            category === null
              ? 'border-brand-primary bg-brand-primary text-white'
              : 'border-brand-tint-strong hover:border-brand-primary'
          "
          @click="choose(null)"
        >
          {{ t('All', 'All') }}
        </button>
        <button
          v-for="item in categories"
          :key="item.slug ?? undefined"
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-medium"
          :class="
            category === item.name
              ? 'border-brand-primary bg-brand-primary text-white'
              : 'border-brand-tint-strong hover:border-brand-primary'
          "
          @click="choose(item.name ?? null)"
        >
          {{ item.name }}
        </button>
      </div>
      <div
        class="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
        :class="loading && 'opacity-60'"
      >
        <ArticleCard
          v-for="article in articles"
          :key="article.slug ?? undefined"
          :article="article"
        />
      </div>
    </CmsBlock>
  </div>
</template>
