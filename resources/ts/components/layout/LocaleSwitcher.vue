<script setup lang="ts">
/**
 * Language switcher. Renders nothing on a monolingual deployment — the whole feature
 * hangs off `locales.length > 1`, so a single-language country never sees it.
 *
 * Deliberately plain <a> elements, not Inertia <Link>: each locale is a different URL
 * served by the server, and switching has to rebuild the app. The Tolgee instance is
 * created once per boot with a fixed language, and `<html lang>` comes from the server
 * render — an SPA visit would swap the props and leave both stale. A full page load
 * also means the edge serves the target locale's cached HTML directly.
 *
 * `desktop` renders the header's hover/focus dropdown (mirroring the primary nav);
 * `mobile` renders a flat row inside the open mobile menu, where there is no hover.
 */
import { useTranslate } from '@tolgee/vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import { useLocale } from '@/composables/useLocale'

withDefaults(defineProps<{ variant?: 'desktop' | 'mobile' }>(), { variant: 'desktop' })

const { t } = useTranslate()
const { locale, locales, currentLocale, isMultilingual, switchUrl } = useLocale()
</script>

<template>
  <div
    v-if="isMultilingual"
    :class="variant === 'mobile' ? 'mt-1 flex flex-wrap gap-2 px-2 py-2' : 'group relative'"
  >
    <template v-if="variant === 'mobile'">
      <a
        v-for="option in locales"
        :key="option.value"
        :href="switchUrl(option.code)"
        :hreflang="option.value"
        :aria-current="option.value === locale ? 'true' : undefined"
        class="rounded-md px-3 py-2 font-display text-lg tracking-wider uppercase transition-colors"
        :class="
          option.value === locale
            ? 'bg-brand-primary-700 text-white'
            : 'text-white/80 hover:bg-brand-primary-700 hover:text-white'
        "
      >
        {{ option.label }}
      </a>
    </template>

    <template v-else>
      <button
        type="button"
        class="inline-flex items-center gap-1 font-display text-sm tracking-wider text-white/90 uppercase transition-colors hover:text-white"
        :aria-label="t('Change language', 'Change language')"
        aria-haspopup="true"
      >
        {{ currentLocale?.label }}
        <IconChevronDown
          class="h-3 w-3 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
        />
      </button>

      <div
        class="invisible absolute top-full right-0 z-50 min-w-36 border-t-4 border-brand-tint-strong bg-white py-2 opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <a
          v-for="option in locales"
          :key="option.value"
          :href="switchUrl(option.code)"
          :hreflang="option.value"
          :aria-current="option.value === locale ? 'true' : undefined"
          class="block px-4 py-1 font-display text-lg leading-7 tracking-wider whitespace-nowrap uppercase transition-colors hover:text-brand-accent-ink"
          :class="option.value === locale ? 'text-brand-accent-ink' : 'text-brand-primary'"
        >
          {{ option.label }}
        </a>
      </div>
    </template>
  </div>
</template>
