<script setup lang="ts">
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import EnquiryFormPanel from '@/components/forms/EnquiryFormPanel.vue'
import PageHero from '@/components/ui/PageHero.vue'
import { useSiteSection } from '@/composables/useSiteSection'
import { photo } from '@/lib/demoImagery'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''
const { value: footer } = useSiteSection('Site Footer')
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
      :image="photo('baristaSmile', 1800)"
      detail='websitePage(slug: "contact")'
    />
    <section class="container grid gap-10 py-16 lg:grid-cols-12">
      <div class="lg:col-span-4">
        <h2 class="heading-display text-3xl text-brand-primary">
          {{ t('Head office', 'Head office') }}
        </h2>
        <p class="mt-4 leading-relaxed text-muted">
          1508 S Congress Ave, Suite 200<br />Austin, TX 78704
        </p>
        <p class="mt-4 font-semibold text-brand-primary">{{ footer('Head Office Phone') }}</p>
        <p class="text-muted">{{ footer('Head Office Email') }}</p>
      </div>
      <div class="lg:col-span-8">
        <EnquiryFormPanel
          form-name="Contact Us"
          :heading="t('Send us a message', 'Send us a message')"
          :submit-label="t('Send message', 'Send message')"
        />
      </div>
    </section>
  </div>
</template>
