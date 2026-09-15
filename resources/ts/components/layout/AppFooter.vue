<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@tolgee/vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import { useSiteSection } from '@/composables/useSiteSection'
import { STRUCTURE } from '@/constants/structure'
import { useFooterMenuService } from '@/services/websiteMenus/footerMenuService'

const { t } = useTranslate()
const { value } = useSiteSection('Site Footer')
const { footerColumns, legalLinks } = useFooterMenuService()

const links = computed(() => footerColumns.value.flatMap((column) => column.links))
const year = computed(() => new Date().getFullYear())
const isExternal = (href: string) => /^https?:\/\//.test(href)
</script>

<template>
  <CmsBlock
    :info="STRUCTURE.footer"
    as="footer"
    class="bg-brand-primary pb-24 text-white"
  >
    <div class="container grid gap-12 py-16 lg:grid-cols-12">
      <div class="lg:col-span-5">
        <BrandLogo class="text-white" />
        <p class="mt-5 max-w-md leading-relaxed text-white/75">
          {{ value('About Text') }}
        </p>
        <dl class="mt-6 space-y-1 text-sm text-white/75">
          <div v-if="value('Head Office Phone')">
            <dt class="sr-only">{{ t('Phone', 'Phone') }}</dt>
            <dd>{{ value('Head Office Phone') }}</dd>
          </div>
          <div v-if="value('Head Office Email')">
            <dt class="sr-only">{{ t('Email', 'Email') }}</dt>
            <dd>{{ value('Head Office Email') }}</dd>
          </div>
        </dl>
      </div>

      <nav
        class="lg:col-span-7"
        :aria-label="t('Footer', 'Footer')"
      >
        <ul class="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <li
            v-for="link in links"
            :key="link.label"
          >
            <LocaleLink
              :href="link.href"
              class="text-white/80 transition-colors hover:text-white"
            >
              {{ link.label }}
            </LocaleLink>
          </li>
        </ul>
      </nav>
    </div>

    <div
      class="container flex flex-col gap-3 border-t border-brand-primary-700 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        {{
          t('footer.copyright', '© {year} Hungry Gorilla. A fictional brand.', {
            year: String(year)
          })
        }}
      </p>
      <a
        href="https://gorilladash.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 font-medium text-white/80 hover:text-white"
      >
        {{ t('footer.builtOn', 'Built on Gorilla Dash') }}
        <span aria-hidden="true">→</span>
      </a>
      <ul class="flex flex-wrap gap-5">
        <li
          v-for="link in legalLinks"
          :key="link.label"
        >
          <a
            :href="link.href"
            :target="isExternal(link.href) ? '_blank' : undefined"
            rel="noopener noreferrer"
            class="hover:text-white"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>
    </div>
  </CmsBlock>
</template>
