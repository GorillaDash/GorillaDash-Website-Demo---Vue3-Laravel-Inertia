<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import { GetOrganisationOurWorksDocument } from '@/api/ourWorks.generated'
import { usePagePaths } from '@/composables/usePagePaths'
import { useQuery } from '@/composables/useQuery'
import { STRUCTURE } from '@/constants/structure'
import { photo } from '@/lib/demoImagery'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''
const { pagePath } = usePagePaths()

const perPage = ref(9)
const { result, loading } = useQuery(GetOrganisationOurWorksDocument, () => ({
  page: 1,
  itemsPerPage: perPage.value,
  featured: null
}))
const posts = computed(() => result.value?.organisationOurWorks?.data ?? [])
const hasMore = computed(() => result.value?.organisationOurWorks?.has_more_pages ?? false)
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
      :image="photo('banquet', 1800)"
      detail='websitePage(slug: "our-work")'
    />
    <CmsBlock
      :info="STRUCTURE.organisationOurWork"
      detail="organisationOurWorks(page, itemsPerPage)"
      as="section"
      class="container py-16"
    >
      <div class="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        <WorkCard
          v-for="post in posts"
          :key="post.slug ?? undefined"
          :post="post"
        />
      </div>
      <div
        v-if="hasMore"
        class="mt-12 text-center"
      >
        <AppButton
          variant="outline"
          :disabled="loading"
          @click="perPage += 9"
        >
          {{ t('Show more', 'Show more') }}
        </AppButton>
      </div>
      <div
        class="mt-16 flex flex-col items-start justify-between gap-6 rounded-card bg-brand-tint p-10 sm:flex-row sm:items-center"
      >
        <h2 class="heading-display text-3xl text-brand-primary">
          {{ t('ourWork.cta', 'Planning something like this?') }}
        </h2>
        <AppButton :href="pagePath('book')">{{
          t('Book a consultation', 'Book a consultation')
        }}</AppButton>
      </div>
    </CmsBlock>
  </div>
</template>
