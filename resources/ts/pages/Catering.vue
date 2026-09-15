<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import EnquiryFormPanel from '@/components/forms/EnquiryFormPanel.vue'
import MenuCard from '@/components/menu/MenuCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import { getOrganisationOurWorks } from '@/api/ourWorks'
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

const { sections } = useFoodMenuService('Catering Menu')
const { result } = getOrganisationOurWorks({ page: 1, itemsPerPage: 3 })
const work = computed(() => result.value?.organisationOurWorks?.data ?? [])

const steps = computed(() =>
  [1, 2, 3].map((number) => ({
    number,
    title: field(`Step ${number} Title`),
    text: field(`Step ${number} Text`)
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
      :eyebrow="t('Catering', 'Catering')"
      :title="field('Hero Heading')"
      :subtitle="field('Hero Subheading')"
      :image="photo('buffet', 1800)"
      detail='websitePage(slug: "catering")'
    >
      <div class="flex flex-wrap gap-3">
        <AppButton
          :href="pagePath('book')"
          size="lg"
          >{{ t('Book a consultation', 'Book a consultation') }}</AppButton
        >
        <AppButton
          href="#quote"
          variant="light"
          size="lg"
          >{{ t('Request a quote', 'Request a quote') }}</AppButton
        >
      </div>
    </PageHero>

    <CmsBlock
      :info="STRUCTURE.page"
      detail='websitePage(slug: "catering") · Step fields'
      as="section"
      class="container py-16"
    >
      <ol class="grid gap-6 md:grid-cols-3">
        <li
          v-for="stepItem in steps"
          :key="stepItem.number"
          class="rounded-card border border-brand-tint-strong bg-white p-6"
        >
          <span
            class="grid size-11 place-items-center rounded-full bg-brand-accent heading-display text-xl text-brand-on-accent"
            >{{ stepItem.number }}</span
          >
          <h2 class="mt-4 heading-display text-2xl text-brand-primary">{{ stepItem.title }}</h2>
          <p class="mt-2 leading-relaxed text-muted">{{ stepItem.text }}</p>
        </li>
      </ol>
    </CmsBlock>

    <CmsBlock
      :info="STRUCTURE.cateringMenu"
      as="section"
      class="bg-brand-tint py-16"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Catering menu', 'Catering menu')"
          :title="t('catering.menuTitle', 'Boards, boxes and trays')"
          :caption="
            t(
              'catering.menuCaption',
              'Order online for pickup or delivery with 24 hours notice, or talk to us about a custom menu.'
            )
          "
        />
        <div
          v-for="section in sections"
          :key="section.slug"
          class="mt-12"
        >
          <h3 class="heading-display text-2xl text-brand-primary">{{ section.name }}</h3>
          <p class="text-muted">{{ section.description }}</p>
          <div class="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MenuCard
              v-for="card in section.cards"
              :key="card.id"
              :card="card"
            />
          </div>
        </div>
      </div>
    </CmsBlock>

    <CmsBlock
      :info="STRUCTURE.organisationOurWork"
      as="section"
      class="container py-16"
    >
      <SectionHeader
        :eyebrow="t('Our work', 'Our work')"
        :title="t('catering.workTitle', 'Recent events')"
      >
        <template #action>
          <AppButton
            :href="pagePath('our-work')"
            variant="outline"
            >{{ t('See all events', 'See all events') }}</AppButton
          >
        </template>
      </SectionHeader>
      <div class="mt-8 grid gap-8 md:grid-cols-3">
        <WorkCard
          v-for="post in work"
          :key="post.slug ?? undefined"
          :post="post"
        />
      </div>
    </CmsBlock>

    <section
      id="quote"
      class="scroll-mt-32 bg-brand-primary py-16"
    >
      <div class="container grid items-center gap-10 lg:grid-cols-2">
        <div class="text-white">
          <h2 class="heading-display text-4xl sm:text-5xl">{{ field('CTA Heading') }}</h2>
          <p class="mt-4 text-lg text-white/80">{{ field('CTA Text') }}</p>
          <SmartImage
            :src="photo('platingGloves', 1000)"
            alt="A chef plating catering food"
            class="mt-8 hidden aspect-video w-full rounded-card lg:block"
          />
        </div>
        <EnquiryFormPanel
          form-name="Catering Quote"
          :heading="t('Request a catering quote', 'Request a catering quote')"
          :intro="
            t('catering.formIntro', 'Your local catering lead replies within one business day.')
          "
          :submit-label="t('Request quote', 'Request quote')"
        />
      </div>
    </section>
  </div>
</template>
