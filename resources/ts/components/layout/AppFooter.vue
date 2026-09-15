<script setup lang="ts">
import LocaleLink from '@/components/core/LocaleLink.vue'
import { useTranslate } from '@tolgee/vue'
import { computed } from 'vue'
import IconFacebook from '@/components/icons/IconFacebook.vue'
import IconInstagram from '@/components/icons/IconInstagram.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import { socialLinks } from '@/constants/navigation'
import { useFooterMenuService } from '@/services/websiteMenus/footerMenuService'

const { t } = useTranslate()

const socialIcons = { instagram: IconInstagram, facebook: IconFacebook }

const year = computed(() => new Date().getFullYear())

// footerColumns (Top group) and legalLinks (Bottom group) come from the API
// "Footer Menu"; socialLinks stays a constant — it isn't part of the menu.
const { loading, footerColumns, legalLinks } = useFooterMenuService()
</script>

<template>
  <footer class="bg-brand-primary text-white">
    <div class="container py-12 lg:py-16">
      <!-- Brand + link columns -->
      <div class="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <BrandLogo class="h-11 lg:h-12" />

        <div class="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-12">
          <!-- Skeleton placeholders while the menu loads -->
          <template v-if="loading && !footerColumns.length">
            <div
              v-for="col in 3"
              :key="col"
              class="flex flex-col gap-3"
            >
              <span
                v-for="row in 4"
                :key="row"
                class="h-4 w-24 animate-pulse rounded bg-white/20"
                aria-hidden="true"
              />
            </div>
          </template>

          <nav
            v-for="(column, index) in footerColumns"
            v-else
            :key="index"
            class="flex flex-col gap-3 font-serif text-base font-bold tracking-wide"
            :aria-label="t('Footer', 'Footer')"
          >
            <LocaleLink
              v-for="link in column.links"
              :key="link.label"
              :href="link.href"
              class="text-white/80 transition-colors hover:text-white"
            >
              {{ link.label }}
            </LocaleLink>
          </nav>
        </div>
      </div>

      <hr class="my-8 border-brand-primary-700 lg:my-10" />

      <!-- Bottom bar -->
      <div
        class="flex flex-col items-center gap-6 text-center text-sm md:flex-row md:justify-between md:gap-4 md:text-left"
      >
        <p class="font-serif font-bold text-white/70">
          {{
            t('footer.copyright', '© {year} Juniper Table. All rights reserved.', {
              year: String(year)
            })
          }}
        </p>

        <ul class="flex items-center gap-5">
          <li
            v-for="social in socialLinks"
            :key="social.label"
          >
            <a
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/80 transition-colors hover:text-white"
              :aria-label="social.label"
            >
              <component
                :is="socialIcons[social.icon]"
                class="h-5 w-5"
              />
            </a>
          </li>
        </ul>

        <div class="flex items-center gap-2 font-serif font-bold text-white/70">
          <template
            v-for="(link, index) in legalLinks"
            :key="link.label"
          >
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="transition-colors hover:text-white"
            >
              {{ link.label }}
            </a>
            <span
              v-if="index < legalLinks.length - 1"
              aria-hidden="true"
              >|</span
            >
          </template>
        </div>
      </div>
    </div>
  </footer>
</template>
