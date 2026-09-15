<script setup lang="ts">
import { computed } from 'vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import type { OurWorkInfoResult } from '@/api/ourWorks'
import { imageOr, workPhoto } from '@/lib/demoImagery'
import { formatDate } from '@/lib/format'
import { getImageByMediaCollectionName } from '@/services/mediaService'

const props = withDefaults(defineProps<{ post: OurWorkInfoResult; linked?: boolean }>(), {
  linked: true
})

const { cmsRoute } = usePagePaths()

const image = computed(() =>
  imageOr(
    getImageByMediaCollectionName('gallery', 'rectangle', props.post.media_collection),
    workPhoto(props.post.slug ?? '')
  )
)
</script>

<template>
  <component
    :is="linked ? LocaleLink : 'article'"
    :href="linked ? cmsRoute('ourWork.show', { work: post.slug ?? '' }) : undefined"
    class="group flex h-full flex-col"
  >
    <div class="aspect-4/3 overflow-hidden rounded-card">
      <SmartImage
        :src="image"
        :alt="post.heading ?? ''"
        class="size-full transition duration-500 group-hover:scale-105"
      />
    </div>
    <div class="flex flex-col gap-1.5 pt-4">
      <p class="text-xs font-semibold tracking-widest text-brand-accent-ink uppercase">
        {{ post.client_name }}
      </p>
      <h3 class="heading-display text-xl leading-snug text-brand-primary group-hover:underline">
        {{ post.heading }}
      </h3>
      <p class="text-sm leading-relaxed text-muted">{{ post.excerpt }}</p>
      <p class="text-xs text-muted">{{ formatDate(post.published_at) }}</p>
    </div>
  </component>
</template>
