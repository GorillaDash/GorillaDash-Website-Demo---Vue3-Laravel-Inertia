<script setup lang="ts">
import { computed } from 'vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import type { ArticleInfoFragment } from '@/api/article.generated'
import { articlePhoto, imageOr } from '@/lib/demoImagery'
import { formatDate } from '@/lib/format'
import { getImageByMediaCollectionName } from '@/services/mediaService'

const props = defineProps<{ article: ArticleInfoFragment }>()

const { cmsRoute } = usePagePaths()

const image = computed(() =>
  imageOr(
    getImageByMediaCollectionName('banner', 'rectangle', props.article.media_collection),
    articlePhoto(props.article.slug ?? '')
  )
)
const category = computed(() => props.article.article_categories?.[0]?.name ?? '')
</script>

<template>
  <LocaleLink
    :href="cmsRoute('blog.show', { article: article.slug ?? '' })"
    class="group flex h-full flex-col"
  >
    <div class="aspect-3/2 overflow-hidden rounded-card">
      <SmartImage
        :src="image"
        :alt="article.heading ?? ''"
        class="size-full transition duration-500 group-hover:scale-105"
      />
    </div>
    <div class="flex flex-col gap-2 pt-4">
      <p class="text-xs font-semibold tracking-widest text-brand-accent-ink uppercase">
        {{ category }}<span v-if="category"> · </span>{{ formatDate(article.created_at) }}
      </p>
      <h3 class="heading-display text-xl leading-snug text-brand-primary group-hover:underline">
        {{ article.heading }}
      </h3>
      <p class="line-clamp-2 text-sm leading-relaxed text-muted">{{ article.abstract }}</p>
    </div>
  </LocaleLink>
</template>
