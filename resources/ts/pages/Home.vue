<script setup lang="ts">
import { computed } from 'vue'
import { Head } from '@inertiajs/vue3'
import { useTranslate } from '@tolgee/vue'
import HomeHero from '@/components/home/HomeHero.vue'
import { useWebsitePageService } from '@/services/websitePageService'
import { getValueByName, getImageByName } from '@/services/websiteContentValue'
import type { HeroContent } from '@/types/home'

/**
 * The homepage, deliberately just a hero.
 *
 * It is the worked example of the whole content path — the CMS slug arrives as a
 * prop, `websitePage` is fetched by that slug, and named content values are
 * mapped onto a presentational component. Add the client's real sections below
 * <HomeHero>, following the same shape.
 */
const { t } = useTranslate()

// The page's CMS slug, resolved per request by WebsitePageController — renaming
// it in the CMS moves the content fetch with it, no rebuild.
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })

// No defineOptions({ layout }) → automatically uses the default AppLayout set in app.ts

const hero = computed((): HeroContent => {
  return {
    heading: getValueByName('Banner Heading', page.value) ?? '',
    subheading: getValueByName('Banner Sub Heading', page.value) ?? '',
    image: getImageByName('Banner Image', page.value) ?? '',
    cta: {
      label: getValueByName('Banner CTA Label', page.value) ?? t.value('Learn More', 'Learn More'),
      href: getValueByName('Banner CTA Link', page.value) ?? '#'
    }
  }
})
</script>

<template>
  <div>
    <Head :title="page?.name ?? ''" />
    <HomeHero :content="hero" />
  </div>
</template>
