<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import EnquiryFormPanel from '@/components/forms/EnquiryFormPanel.vue'
import TribeCard from '@/components/tribe/TribeCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { getFaqs } from '@/api/faq'
import { useTribes } from '@/composables/useTribes'
import { STRUCTURE } from '@/constants/structure'
import { photo } from '@/lib/demoImagery'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''

const { trading, openingSoon, states } = useTribes()
const { result: faqResult } = getFaqs()
const faqs = computed(
  () =>
    (faqResult.value?.websiteFaqCategory ?? []).find((category) => category?.name === 'Franchising')
      ?.website_faqs ?? []
)

const numbers = computed(() => [
  { label: t.value('Franchise fee', 'Franchise fee'), value: field('Franchise Fee') },
  { label: t.value('Total investment', 'Total investment'), value: field('Total Investment') },
  { label: t.value('Royalty', 'Royalty'), value: field('Royalty') },
  { label: t.value('Marketing fund', 'Marketing fund'), value: field('Marketing Fund') }
])
const reasons = computed(() =>
  [1, 2, 3, 4].map((number) => ({
    title: field(`Reason ${number} Title`),
    text: field(`Reason ${number} Text`)
  }))
)
const steps = computed(() =>
  [1, 2, 3, 4].map((number) => ({
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

    <CmsBlock
      :info="STRUCTURE.page"
      detail='websitePage(slug: "franchise")'
      as="section"
      class="relative overflow-hidden bg-brand-primary text-white"
    >
      <div class="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p class="mb-4 text-sm font-semibold tracking-widest text-brand-tint-strong uppercase">
            {{ field('Hero Eyebrow') }}
          </p>
          <h1 class="heading-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            {{ field('Hero Heading') }}
          </h1>
          <p class="mt-6 text-lg leading-relaxed text-white/85">{{ field('Hero Subheading') }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <AppButton
              href="#enquire"
              size="lg"
              >{{ t('Start your enquiry', 'Start your enquiry') }}</AppButton
            >
            <AppButton
              href="#investment"
              variant="light"
              size="lg"
              >{{ t('See the investment', 'See the investment') }}</AppButton
            >
          </div>
          <dl class="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
            <div>
              <dd class="heading-display text-4xl">{{ trading.length }}</dd>
              <dt class="text-sm text-white/70">{{ t('Cafes trading', 'Cafes trading') }}</dt>
            </div>
            <div>
              <dd class="heading-display text-4xl">{{ openingSoon.length }}</dd>
              <dt class="text-sm text-white/70">{{ t('Opening soon', 'Opening soon') }}</dt>
            </div>
            <div>
              <dd class="heading-display text-4xl">{{ states }}</dd>
              <dt class="text-sm text-white/70">{{ t('States', 'States') }}</dt>
            </div>
          </dl>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <SmartImage
            :src="photo('ownerSmile', 800)"
            alt="A Juniper Table owner in his cafe"
            eager
            class="aspect-3/4 w-full rounded-card"
          />
          <SmartImage
            :src="photo('teamKitchen', 800)"
            alt="A cafe team at work in the kitchen"
            class="mt-12 aspect-3/4 w-full rounded-card"
          />
        </div>
      </div>
    </CmsBlock>

    <CmsBlock
      id="investment"
      :info="STRUCTURE.page"
      detail='websitePage(slug: "franchise") · Investment fields'
      as="section"
      class="container scroll-mt-32 py-16"
    >
      <SectionHeader
        :eyebrow="t('The investment', 'The investment')"
        :title="t('franchise.numbersTitle', 'What it takes to open')"
        align="center"
      />
      <dl class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="item in numbers"
          :key="item.label"
          class="rounded-card border border-brand-tint-strong bg-white p-6 text-center"
        >
          <dt class="text-sm text-muted">{{ item.label }}</dt>
          <dd class="mt-2 heading-display text-2xl text-brand-primary lg:text-3xl">
            {{ item.value }}
          </dd>
        </div>
      </dl>
    </CmsBlock>

    <section class="bg-brand-tint py-16">
      <div class="container">
        <SectionHeader :title="field('Why Heading')" />
        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <article
            v-for="(reason, index) in reasons"
            :key="index"
            class="flex gap-5 rounded-card bg-white p-6"
          >
            <span
              class="grid size-12 shrink-0 place-items-center rounded-full bg-brand-primary heading-display text-xl text-white"
              >{{ index + 1 }}</span
            >
            <div>
              <h3 class="heading-display text-2xl text-brand-primary">{{ reason.title }}</h3>
              <p class="mt-2 leading-relaxed text-muted">{{ reason.text }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="container py-16">
      <SectionHeader :title="field('Steps Heading')" />
      <ol class="mt-10 grid gap-6 md:grid-cols-4">
        <li
          v-for="stepItem in steps"
          :key="stepItem.number"
          class="relative border-t-4 border-brand-accent pt-5"
        >
          <p class="text-sm font-semibold text-brand-accent">
            {{ t('Step', 'Step') }} {{ stepItem.number }}
          </p>
          <h3 class="mt-1 heading-display text-2xl text-brand-primary">{{ stepItem.title }}</h3>
          <p class="mt-2 leading-relaxed text-muted">{{ stepItem.text }}</p>
        </li>
      </ol>
    </section>

    <CmsBlock
      v-if="openingSoon.length"
      :info="{
        module: 'Tribes',
        query: 'tribes(status: &quot;all&quot;) · status Opening Soon',
        edit: 'Tribes › Status',
        scope: 'Organisation'
      }"
      as="section"
      class="bg-brand-tint py-16"
    >
      <div class="container">
        <SectionHeader
          :eyebrow="t('Growing now', 'Growing now')"
          :title="t('franchise.soonTitle', 'Our newest owners')"
        />
        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <TribeCard
            v-for="tribe in openingSoon"
            :key="tribe.slug"
            :tribe="tribe"
            compact
          />
        </div>
      </div>
    </CmsBlock>

    <section
      id="enquire"
      class="container grid scroll-mt-32 gap-10 py-16 lg:grid-cols-12"
    >
      <CmsBlock
        :info="{
          module: 'Website FAQ',
          query: 'websiteFaqCategory · Franchising',
          edit: 'Websites › FAQs › Franchising',
          scope: 'Organisation'
        }"
        class="lg:col-span-5"
      >
        <h2 class="heading-display text-3xl text-brand-primary">
          {{ t('Questions owners ask', 'Questions owners ask') }}
        </h2>
        <div class="mt-6 divide-y divide-brand-tint-strong border-y border-brand-tint-strong">
          <details
            v-for="faq in faqs"
            :key="faq?.slug ?? undefined"
            class="group py-4"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-primary"
            >
              {{ faq?.question }}
              <span class="text-xl transition group-open:rotate-45">+</span>
            </summary>
            <div
              class="prose mt-3 text-muted"
              v-html="faq?.answer"
            />
          </details>
        </div>
      </CmsBlock>
      <div class="lg:col-span-7">
        <EnquiryFormPanel
          form-name="Franchise Enquiry"
          :heading="field('Form Heading')"
          :intro="field('Form Text')"
          :choose-tribe="false"
          :submit-label="t('Send my enquiry', 'Send my enquiry')"
        />
      </div>
    </section>
  </div>
</template>
