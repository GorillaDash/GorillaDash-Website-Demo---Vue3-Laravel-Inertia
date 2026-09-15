<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Head } from '@inertiajs/vue3'
import SeoHead from '@/components/core/SeoHead.vue'
import LocationFinder from '@/components/location/LocationFinder.vue'
import OpenLocationCta from '@/components/location/OpenLocationCta.vue'
import { useWebsitePageService } from '@/services/websitePageService'
import { getValueByName } from '@/services/websiteContentValue'
import { clearBoundLocation } from '@/lib/boundLocation'
import type { OpenLocationContent } from '@/types/locations'

// No defineOptions({ layout }) → automatically uses the default AppLayout (header + footer).

// The page's CMS slug, resolved per request by WebsitePageController — renaming
// it in the CMS moves the content fetch with it, no rebuild.
const props = defineProps<{ slug: string }>()

// Browsing back out drops the locked store. The GET render is a pure read so the
// edge can cache it — the session write happens through this post-mount beacon.
onMounted(() => {
  void clearBoundLocation()
})

// Locations page content from the GD CMS. `page.contents` still needs mapping into
// the sections below — the fake data stays until then.
const { page } = useWebsitePageService({ slug: props.slug })

const headerTitle = computed(() => getValueByName('Page Heading', page.value) ?? '')
const searchBarTitle = computed(() => getValueByName('Search Heading', page.value) ?? '')
const searchPlaceholder = computed(() => getValueByName('Search Bar Text', page.value) ?? '')
const metaTitle = computed(() => page.value?.meta_title ?? '')
const metaDescription = computed(() => page.value?.meta_description ?? '')

const franchise = computed<OpenLocationContent>(() => {
  return {
    title: getValueByName('Franchise Heading', page.value) ?? '',
    description: getValueByName('Franchise Caption', page.value) ?? '',
    cta: {
      label: getValueByName('Franchise Button Label', page.value) ?? '',
      href: getValueByName('Franchise Button URL', page.value) ?? ''
    }
  }
})
</script>

<template>
  <div>
    <SeoHead
      :title="metaTitle"
      :description="metaDescription"
    />

    <section class="container py-12 lg:py-16">
      <h1
        class="text-center font-condensed text-4xl leading-none font-medium tracking-wider text-brand-primary uppercase sm:text-5xl lg:text-6xl xl:text-7xl"
      >
        {{ headerTitle }}
      </h1>

      <LocationFinder
        class="mt-10"
        :header-title="searchBarTitle"
        :search-placeholder="searchPlaceholder"
      />
    </section>

    <OpenLocationCta :content="franchise" />
  </div>
</template>
