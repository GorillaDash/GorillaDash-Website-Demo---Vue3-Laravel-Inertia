<script setup lang="ts">
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import { usePagePaths } from '@/composables/usePagePaths'
import { useSiteSection } from '@/composables/useSiteSection'
import { STRUCTURE } from '@/constants/structure'

/** The "own a franchise" strip above the header, on every page — as on every franchise site we run. */
const { value } = useSiteSection('Franchise Banner')
const { pagePath } = usePagePaths()
</script>

<template>
  <CmsBlock
    :info="STRUCTURE.franchiseBanner"
    label-align="end"
    class="bg-brand-primary text-white"
  >
    <div class="container flex min-h-10 items-center justify-center gap-3 py-2 text-center text-sm">
      <span class="hidden text-white/85 sm:inline">{{
        value('Banner Text') || 'Own a Juniper Table in your city.'
      }}</span>
      <LocaleLink
        :href="pagePath('franchise')"
        class="font-semibold text-brand-tint-strong underline-offset-4 hover:text-white hover:underline"
      >
        {{ value('Banner CTA Label') || 'Learn about franchising' }} →
      </LocaleLink>
    </div>
  </CmsBlock>
</template>
