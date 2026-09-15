<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { getArticle } from '@/api/article'
import { usePagePaths } from '@/composables/usePagePaths'
import { STRUCTURE } from '@/constants/structure'
import { articlePhoto, imageOr } from '@/lib/demoImagery'
import { formatDate } from '@/lib/format'
import { getImageByMediaCollectionName } from '@/services/mediaService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()
const { pagePath, cmsRoute } = usePagePaths()

const { result } = getArticle(props.slug)
const article = computed(() => result.value?.article ?? null)
const image = computed(() =>
  imageOr(
    getImageByMediaCollectionName('banner', 'banner', article.value?.media_collection),
    articlePhoto(props.slug, 1800)
  )
)
</script>

<template>
  <div>
    <SeoHead
      :title="article?.meta_title ?? article?.heading ?? ''"
      :description="article?.meta_description ?? article?.abstract ?? ''"
      type="article"
    />
    <CmsBlock
      :info="STRUCTURE.articles"
      :detail="`article(slug: &quot;${slug}&quot;, status: &quot;Published&quot;)`"
      as="article"
      class="container max-w-3xl py-12"
    >
      <LocaleLink
        :href="pagePath('blog')"
        class="text-sm font-semibold text-brand-accent-ink hover:underline"
        >← {{ t('The journal', 'The journal') }}</LocaleLink
      >
      <h1 class="mt-6 heading-display text-4xl leading-tight text-brand-primary sm:text-5xl">
        {{ article?.heading }}
      </h1>
      <p class="mt-4 text-xl text-muted">{{ article?.abstract }}</p>
      <p class="mt-3 text-sm text-muted">
        {{ article?.author }} · {{ formatDate(article?.created_at) }}
      </p>
      <SmartImage
        :src="image"
        :alt="article?.heading ?? ''"
        eager
        class="mt-8 aspect-video w-full rounded-card"
      />
      <div
        class="article-body mt-10 text-lg leading-relaxed text-ink"
        v-html="article?.html || article?.article"
      />
      <nav class="mt-14 grid gap-4 border-t border-brand-tint-strong pt-8 sm:grid-cols-2">
        <LocaleLink
          v-if="article?.prev?.slug"
          :href="cmsRoute('blog.show', { article: article.prev.slug })"
          class="rounded-xl p-4 hover:bg-brand-tint"
        >
          <span class="text-sm text-muted">← {{ t('Previous', 'Previous') }}</span>
          <span class="mt-1 block heading-display text-lg text-brand-primary">{{
            article.prev.heading
          }}</span>
        </LocaleLink>
        <LocaleLink
          v-if="article?.next?.slug"
          :href="cmsRoute('blog.show', { article: article.next.slug })"
          class="rounded-xl p-4 text-right hover:bg-brand-tint sm:col-start-2"
        >
          <span class="text-sm text-muted">{{ t('Next', 'Next') }} →</span>
          <span class="mt-1 block heading-display text-lg text-brand-primary">{{
            article.next.heading
          }}</span>
        </LocaleLink>
      </nav>
    </CmsBlock>
  </div>
</template>
