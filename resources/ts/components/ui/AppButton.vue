<script setup lang="ts">
import { computed } from 'vue'
import LocaleLink from '@/components/core/LocaleLink.vue'

/**
 * The site's one button. Renders a LocaleLink for internal paths, an <a> for
 * absolute URLs and a <button> when there is no href.
 */
const props = withDefaults(
  defineProps<{
    href?: string | null
    variant?: 'primary' | 'dark' | 'outline' | 'light' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    external?: boolean
    type?: 'button' | 'submit'
    disabled?: boolean
    form?: string
  }>(),
  { href: undefined, variant: 'primary', size: 'md', external: false, type: 'button', disabled: false, form: undefined }
)

const variantClasses = {
  primary: 'bg-brand-accent text-brand-on-accent hover:bg-brand-accent-600',
  dark: 'bg-brand-primary text-white hover:bg-brand-primary-700',
  outline: 'border border-current text-brand-primary hover:bg-brand-primary hover:text-white',
  light: 'bg-white text-brand-primary hover:bg-brand-tint',
  ghost: 'text-brand-primary underline-offset-4 hover:underline'
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
}

// In-page anchors and mailto:/tel: links stay plain <a> elements: sent through
// LocaleLink they would become a full Inertia visit.
const isAbsolute = (url: string | null | undefined) =>
  !!url && /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)

const tag = computed(() => {
  if (props.href === undefined || props.href === null) {
    return 'button'
  }

  return props.external || isAbsolute(props.href) ? 'a' : LocaleLink
})
</script>

<template>
  <component
    :is="tag"
    :href="tag === 'button' ? undefined : href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
    :form="tag === 'button' ? form : undefined"
    v-bind="external ? { target: '_blank', rel: 'noopener noreferrer' } : {}"
    :class="[
      'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      variantClasses[variant],
      sizeClasses[size]
    ]"
  >
    <slot />
  </component>
</template>
