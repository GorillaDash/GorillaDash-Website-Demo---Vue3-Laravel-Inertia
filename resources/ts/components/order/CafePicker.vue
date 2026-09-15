<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTranslate } from '@tolgee/vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useCart } from '@/composables/useCart'
import { useTribes } from '@/composables/useTribes'

/** "Ordering from" selector. Only trading tribes take orders. */
withDefaults(defineProps<{ inverted?: boolean }>(), { inverted: false })

const { t } = useTranslate()
const { trading } = useTribes()
const { cafeSlug, count, loaded, setCafe } = useCart()

const pendingSlug = ref<string | null>(null)
const confirmOpen = ref(false)

const selected = computed({
  get: () => cafeSlug.value ?? '',
  set: (slug: string) => {
    if (!slug) {
      return
    }
    if (count.value > 0) {
      pendingSlug.value = slug
      confirmOpen.value = true
      return
    }
    setCafe(slug)
  }
})

const pendingName = computed(
  () =>
    trading.value
      .find((tribe) => tribe.slug === pendingSlug.value)
      ?.name.replace(/^Hungry Gorilla\s+/i, '') ?? ''
)
</script>

<template>
  <div class="contents">
    <label
      class="inline-flex items-center gap-2 rounded-full py-1 pr-2 pl-4 text-sm"
      :class="
        inverted
          ? 'bg-white/10 text-white ring-1 ring-white/25'
          : 'bg-white text-brand-primary ring-1 ring-brand-tint-strong'
      "
    >
      <IconMapPin class="size-4 shrink-0 text-brand-accent-ink" />
      <span class="whitespace-nowrap">{{ t('Ordering from', 'Ordering from') }}</span>
      <select
        v-model="selected"
        :disabled="!loaded"
        class="cursor-pointer rounded-full border-0 bg-transparent py-1.5 pr-8 pl-1 font-semibold focus:ring-2 focus:ring-brand-accent"
        :class="inverted ? 'text-white [&>option]:text-ink' : 'text-brand-primary'"
      >
        <option
          value=""
          disabled
        >
          {{ t('Choose a cafe', 'Choose a cafe') }}
        </option>
        <option
          v-for="tribe in trading"
          :key="tribe.slug"
          :value="tribe.slug"
        >
          {{ tribe.name.replace(/^Hungry Gorilla\s+/i, '') }}
        </option>
      </select>
    </label>
    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="t('order.switchCafeTitle', 'Order from {name} instead?', { name: pendingName })"
      :text="
        t(
          'order.switchCafeText',
          'Your order is kept by the cafe you started it with, so switching removes the items in it. This cannot be undone.'
        )
      "
      :confirm-label="t('Switch cafe', 'Switch cafe')"
      @confirm="pendingSlug && setCafe(pendingSlug)"
    />
  </div>
</template>
