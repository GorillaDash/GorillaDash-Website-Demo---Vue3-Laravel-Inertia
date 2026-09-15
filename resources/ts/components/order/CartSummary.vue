<script setup lang="ts">
import { useTranslate } from '@tolgee/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useCart } from '@/composables/useCart'
import { usePagePaths } from '@/composables/usePagePaths'
import { formatPrice } from '@/lib/format'

/** The running order, beside the menu. Every figure comes back from Gorilla Dash. */
withDefaults(defineProps<{ editable?: boolean; showCheckout?: boolean }>(), {
  editable: false,
  showCheckout: true
})

const { t } = useTranslate()
const { pagePath } = usePagePaths()
const { lines, count, subTotal, tax, total, busy, remove } = useCart()
</script>

<template>
  <div class="rounded-card border border-brand-tint-strong bg-white p-6">
    <div class="flex items-center justify-between">
      <h2 class="heading-display text-2xl text-brand-primary">
        {{ t('Your order', 'Your order') }}
      </h2>
      <span class="rounded-full bg-brand-tint px-3 py-1 text-sm font-semibold text-brand-primary">{{
        count
      }}</span>
    </div>

    <p
      v-if="!lines.length"
      class="mt-4 text-sm text-muted"
    >
      {{ t('order.empty', 'Nothing here yet. Choose something from the menu to get started.') }}
    </p>

    <ul
      v-else
      class="mt-4 divide-y divide-brand-tint"
    >
      <li
        v-for="line in lines"
        :key="line.id ?? undefined"
        class="flex gap-3 py-3 text-sm"
      >
        <span class="font-semibold text-brand-primary">{{ line.quantity }}×</span>
        <div class="flex-1">
          <p class="font-medium text-ink">{{ line.foodMenuItem?.name }}</p>
          <p
            v-for="modifier in line.foodShoppingCartModifiers ?? []"
            :key="modifier?.foodModifier?.id ?? undefined"
            class="text-muted"
          >
            {{ modifier?.foodModifier?.label }}
            <span v-if="modifier?.foodModifier?.price"
              >+{{ formatPrice(modifier.foodModifier.price) }}</span
            >
          </p>
          <button
            v-if="editable"
            type="button"
            class="mt-1 text-xs font-semibold text-brand-accent-ink hover:underline disabled:opacity-50"
            :disabled="busy"
            @click="line.id && remove(line.id)"
          >
            {{ t('Remove', 'Remove') }}
          </button>
        </div>
        <span class="font-medium">{{ formatPrice(line.sub_total) }}</span>
      </li>
    </ul>

    <dl
      v-if="lines.length"
      class="mt-4 space-y-1 border-t border-brand-tint-strong pt-4 text-sm"
    >
      <div class="flex justify-between text-muted">
        <dt>{{ t('Subtotal', 'Subtotal') }}</dt>
        <dd>{{ formatPrice(subTotal) }}</dd>
      </div>
      <div class="flex justify-between text-muted">
        <dt>{{ t('Sales tax', 'Sales tax') }}</dt>
        <dd>{{ formatPrice(tax) }}</dd>
      </div>
      <div class="flex justify-between pt-1 text-base font-semibold text-brand-primary">
        <dt>{{ t('Total', 'Total') }}</dt>
        <dd>{{ formatPrice(total) }}</dd>
      </div>
    </dl>

    <AppButton
      v-if="showCheckout && lines.length"
      :href="pagePath('order')"
      class="mt-5 w-full"
    >
      {{ t('Checkout', 'Checkout') }}
    </AppButton>
  </div>
</template>
