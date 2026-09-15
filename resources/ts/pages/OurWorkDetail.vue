<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import { getOrganisationOurWork, getOrganisationOurWorks } from '@/api/ourWorks'
import { usePagePaths } from '@/composables/usePagePaths'
import { STRUCTURE } from '@/constants/structure'
import { imageOr, workPhoto } from '@/lib/demoImagery'
import { formatDate } from '@/lib/format'
import { getImageByMediaCollectionName } from '@/services/mediaService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()
const { pagePath } = usePagePaths()

const { result } = getOrganisationOurWork(props.slug)
const post = computed(() => result.value?.organisationOurWork ?? null)
const image = computed(() =>
  imageOr(
    getImageByMediaCollectionName('gallery', 'banner', post.value?.media_collection),
    workPhoto(props.slug, 1800)
  )
)

const { result: moreResult } = getOrganisationOurWorks({ page: 1, itemsPerPage: 4 })
const more = computed(() =>
  (moreResult.value?.organisationOurWorks?.data ?? [])
    .filter((item) => item.slug !== props.slug)
    .slice(0, 3)
)
</script>

<template>
  <div>
    <SeoHead
      :title="post?.meta_title ?? post?.heading ?? ''"
      :description="post?.meta_description ?? post?.excerpt ?? ''"
      type="article"
    />
    <CmsBlock
      :info="STRUCTURE.organisationOurWork"
      :detail="`organisationOurWork(slug: &quot;${slug}&quot;)`"
      as="article"
      class="container max-w-4xl py-12"
    >
      <LocaleLink
        :href="pagePath('our-work')"
        class="text-sm font-semibold text-brand-accent hover:underline"
        >← {{ t('All events', 'All events') }}</LocaleLink
      >
      <p class="mt-6 text-sm font-semibold tracking-widest text-brand-accent uppercase">
        {{ post?.client_name }}
      </p>
      <h1 class="mt-2 heading-display text-4xl leading-tight text-brand-primary sm:text-5xl">
        {{ post?.heading }}
      </h1>
      <p class="mt-4 text-xl text-muted">{{ post?.excerpt }}</p>
      <p class="mt-2 text-sm text-muted">{{ formatDate(post?.published_at) }}</p>
      <SmartImage
        :src="image"
        :alt="post?.heading ?? ''"
        eager
        class="mt-8 aspect-video w-full rounded-card"
      />
      <div
        class="mt-8 space-y-4 text-lg leading-relaxed text-ink"
        v-html="post?.article"
      />
      <div
        class="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-card bg-brand-tint p-8"
      >
        <p class="heading-display text-2xl text-brand-primary">
          {{ t('ourWork.detailCta', 'Want an event like this?') }}
        </p>
        <AppButton :href="pagePath('book')">{{
          t('Book a consultation', 'Book a consultation')
        }}</AppButton>
      </div>
    </CmsBlock>
    <section
      v-if="more.length"
      class="border-t border-brand-tint-strong bg-white py-14"
    >
      <div class="container">
        <h2 class="heading-display text-3xl text-brand-primary">
          {{ t('More events', 'More events') }}
        </h2>
        <div class="mt-6 grid gap-8 md:grid-cols-3">
          <WorkCard
            v-for="item in more"
            :key="item.slug ?? undefined"
            :post="item"
          />
        </div>
      </div>
    </section>
  </div>
</template>
