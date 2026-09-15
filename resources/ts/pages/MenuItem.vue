<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import MenuCard from '@/components/menu/MenuCard.vue'
import CafePicker from '@/components/order/CafePicker.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SmartImage from '@/components/ui/SmartImage.vue'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { useCart } from '@/composables/useCart'
import { useTribes } from '@/composables/useTribes'
import { usePagePaths } from '@/composables/usePagePaths'
import type { StructureInfo } from '@/constants/structure'
import { formatPrice } from '@/lib/format'
import { useFoodMenuService } from '@/services/foodMenuService'

const { t } = useTranslate()
const props = defineProps<{ section: string; item: string }>()

const { pagePath } = usePagePaths()
const everyday = useFoodMenuService('Website Menu')
const catering = useFoodMenuService('Catering Menu')

const menuName = computed(() =>
  catering.cards.value.some(
    (card) => card.sectionSlug === props.section && card.slug === props.item
  )
    ? 'Catering Menu'
    : 'Website Menu'
)
const allCards = computed(() => [...everyday.cards.value, ...catering.cards.value])
const card = computed(
  () =>
    allCards.value.find(
      (candidate) => candidate.sectionSlug === props.section && candidate.slug === props.item
    ) ?? null
)
const related = computed(() =>
  allCards.value
    .filter((candidate) => candidate.sectionSlug === props.section && candidate.slug !== props.item)
    .slice(0, 3)
)

const structure = computed<StructureInfo>(() => ({
  module: 'Food Menus + Online Ordering',
  query: `foodMenu(name: "${menuName.value}") · addFoodMenuItemToShoppingCart`,
  edit: `Food › Menus › ${menuName.value} › ${card.value?.name ?? ''}`,
  scope: 'Organisation'
}))

const variantId = ref<number | null>(null)
const quantity = ref(1)
const choices = reactive<Record<number, number[]>>({})
const error = ref('')
const added = ref(false)

const variant = computed(
  () =>
    card.value?.items.find((item) => item.id === variantId.value) ?? card.value?.items[0] ?? null
)
const groups = computed(() =>
  (variant.value?.foodModifierGroups ?? []).filter((group) => group !== null)
)

watch(
  card,
  (value) => {
    if (value && variantId.value === null) {
      variantId.value = value.items[0]?.id ?? null
    }
  },
  { immediate: true }
)

// Each size carries its own option groups, so a change of size clears the options
// chosen for the old one rather than sending them with the new size.
watch(variantId, () => {
  for (const groupId of Object.keys(choices)) {
    delete choices[Number(groupId)]
  }
})

const isSingleChoice = (group: { maximum_selection: number | null }) =>
  (group.maximum_selection ?? 0) === 1

const toggle = (group: { id: number; maximum_selection: number | null }, modifierId: number) => {
  const current = choices[group.id] ?? []
  if (isSingleChoice(group)) {
    choices[group.id] = [modifierId]
    return
  }
  if (current.includes(modifierId)) {
    choices[group.id] = current.filter((id) => id !== modifierId)
  } else if (!group.maximum_selection || current.length < group.maximum_selection) {
    choices[group.id] = [...current, modifierId]
  }
}

const unitPrice = computed(() => {
  const base = variant.value?.price ?? 0
  const extras = groups.value.reduce((total, group) => {
    const selected = choices[group.id] ?? []

    return (
      total +
      group.foodModifiers
        .filter((modifier) => selected.includes(modifier.id))
        .reduce((sum, modifier) => sum + (modifier.price ?? 0), 0)
    )
  }, 0)

  return base + extras
})

const { slug: boundSlug } = useBoundLocation()
const { cafeSlug, busy, count, loaded, init, add, clearCafe } = useCart()
const { trading } = useTribes()

// A cafe from the URL or an old visit that no longer takes orders is forgotten, as long
// as nothing is in the cart for it.
watch([trading, loaded], () => {
  if (
    trading.value.length &&
    loaded.value &&
    cafeSlug.value &&
    count.value === 0 &&
    !trading.value.some((tribe) => tribe.slug === cafeSlug.value)
  ) {
    clearCafe()
  }
})

onMounted(() => {
  const requested = new URLSearchParams(window.location.search).get('cafe')
  void init(requested ?? boundSlug.value, requested !== null)
})

const addedMessage = computed(() =>
  t.value('menuItem.added', 'Added. {count, plural, one {# item} other {# items}} in your order.', {
    count: count.value
  })
)

const addToOrder = async () => {
  error.value = ''
  added.value = false

  const missing = groups.value.find(
    (group) => (group.minimum_selection ?? 0) > (choices[group.id]?.length ?? 0)
  )
  if (missing) {
    error.value = t.value('menuItem.required', 'Please choose: {label}', {
      label: missing.label ?? missing.name ?? ''
    })
    return
  }
  if (!cafeSlug.value) {
    error.value = t.value('menuItem.chooseCafe', 'Choose the cafe you are ordering from first')
    return
  }
  if (!card.value || !variant.value) {
    return
  }

  try {
    await add({
      listItemId: card.value.id,
      menuItemId: variant.value.id,
      quantity: quantity.value,
      modifiers: groups.value.flatMap((group) =>
        (choices[group.id] ?? []).map((modifierId) => ({ groupId: group.id, modifierId }))
      )
    })
    added.value = true
  } catch {
    error.value = t.value(
      'menuItem.addFailed',
      'We could not add that to your order. Please try again'
    )
  }
}
</script>

<template>
  <div>
    <SeoHead
      :title="card?.name ?? ''"
      :description="card?.description ?? ''"
    />

    <nav
      class="border-b border-brand-tint-strong bg-white"
      :aria-label="t('Breadcrumb', 'Breadcrumb')"
    >
      <ol class="container flex items-center gap-2 py-3 text-sm text-muted">
        <li>
          <LocaleLink
            :href="menuName === 'Catering Menu' ? pagePath('catering') : pagePath('menu')"
            class="hover:text-brand-primary"
            >{{
              menuName === 'Catering Menu' ? t('Catering', 'Catering') : t('Menu', 'Menu')
            }}</LocaleLink
          >
        </li>
        <li aria-hidden="true">/</li>
        <li>{{ card?.sectionName }}</li>
        <li aria-hidden="true">/</li>
        <li class="font-medium text-brand-primary">{{ card?.name }}</li>
      </ol>
    </nav>

    <CmsBlock
      :info="structure"
      as="section"
      class="container grid gap-12 py-12 lg:grid-cols-2"
    >
      <div>
        <SmartImage
          v-if="card"
          :src="card.image.replace('w=800', 'w=1400')"
          :alt="card.name"
          eager
          class="aspect-4/3 w-full rounded-(--radius-card)"
        />
        <div
          v-else
          class="aspect-4/3 w-full animate-pulse rounded-card bg-brand-tint"
        />
      </div>

      <div>
        <p class="text-sm font-semibold tracking-widest text-brand-accent-ink uppercase">
          {{ card?.sectionName }}
        </p>
        <h1 class="mt-2 heading-display text-4xl leading-tight text-brand-primary sm:text-5xl">
          {{ card?.name }}
        </h1>
        <p class="mt-4 text-lg leading-relaxed text-muted">{{ card?.description }}</p>
        <p
          v-if="variant?.allergy_statement"
          class="mt-3 text-sm text-muted"
        >
          <span class="font-semibold text-ink">{{ t('Allergens', 'Allergens') }}:</span>
          {{ variant.allergy_statement }}
        </p>

        <form
          class="mt-8 space-y-7"
          @submit.prevent="addToOrder"
        >
          <fieldset v-if="(card?.items.length ?? 0) > 1">
            <legend class="font-semibold text-brand-primary">{{ t('Size', 'Size') }}</legend>
            <div class="mt-3 grid gap-2">
              <label
                v-for="option in card?.items ?? []"
                :key="option.id"
                class="flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3"
                :class="
                  variantId === option.id
                    ? 'border-brand-accent bg-brand-tint'
                    : 'border-brand-tint-strong'
                "
              >
                <span class="flex items-center gap-3">
                  <input
                    v-model="variantId"
                    type="radio"
                    :value="option.id"
                    class="text-brand-accent-ink focus:ring-brand-accent"
                  />
                  {{ (option.name ?? '').replace(`${card?.name} - `, '') }}
                </span>
                <span class="font-semibold">{{ formatPrice(option.price) }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset
            v-for="group in groups"
            :key="group.id"
          >
            <legend
              class="flex w-full items-center justify-between font-semibold text-brand-primary"
            >
              {{ group.label ?? group.name }}
              <span class="text-xs font-normal text-muted">
                {{
                  (group.minimum_selection ?? 0) > 0
                    ? t('Required', 'Required')
                    : t('Optional', 'Optional')
                }}
                <template v-if="(group.maximum_selection ?? 0) > 1">
                  ·
                  {{
                    t('menuItem.upTo', 'up to {count}', { count: group.maximum_selection })
                  }}</template
                >
              </span>
            </legend>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="modifier in group.foodModifiers"
                :key="modifier.id"
                type="button"
                class="rounded-full border px-4 py-2 text-sm transition"
                :class="
                  (choices[group.id] ?? []).includes(modifier.id)
                    ? 'border-brand-accent bg-brand-accent text-brand-on-accent'
                    : 'border-brand-tint-strong bg-white hover:border-brand-primary'
                "
                :aria-pressed="(choices[group.id] ?? []).includes(modifier.id)"
                @click="toggle(group, modifier.id)"
              >
                {{ modifier.label }}
                <span v-if="modifier.price">+{{ formatPrice(modifier.price) }}</span>
              </button>
            </div>
          </fieldset>

          <div>
            <p class="mb-3 font-semibold text-brand-primary">{{ t('Order from', 'Order from') }}</p>
            <CafePicker />
          </div>

          <div class="flex flex-wrap items-center gap-4 border-t border-brand-tint-strong pt-6">
            <div class="flex items-center rounded-full border border-brand-tint-strong bg-white">
              <button
                type="button"
                class="size-11 rounded-full text-xl hover:bg-brand-tint"
                :aria-label="t('Decrease quantity', 'Decrease quantity')"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                −
              </button>
              <span class="w-8 text-center font-semibold">{{ quantity }}</span>
              <button
                type="button"
                class="size-11 rounded-full text-xl hover:bg-brand-tint"
                :aria-label="t('Increase quantity', 'Increase quantity')"
                @click="quantity++"
              >
                +
              </button>
            </div>
            <AppButton
              type="submit"
              size="lg"
              :disabled="busy || !card"
            >
              {{
                busy
                  ? t('Adding…', 'Adding…')
                  : t('menuItem.add', 'Add to order · {price}', {
                      price: formatPrice(unitPrice * quantity)
                    })
              }}
            </AppButton>
          </div>

          <p
            v-if="error"
            class="text-sm font-semibold text-red-700"
            role="alert"
          >
            {{ error }}
          </p>
          <div
            v-if="added"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            <span>{{ addedMessage }}</span>
            <LocaleLink
              :href="pagePath('order')"
              class="font-semibold underline"
              >{{ t('Checkout', 'Checkout') }} →</LocaleLink
            >
          </div>
        </form>
      </div>
    </CmsBlock>

    <section
      v-if="related.length"
      class="border-t border-brand-tint-strong bg-brand-tint py-14"
    >
      <div class="container">
        <h2 class="heading-display text-3xl text-brand-primary">
          {{ t('You might also like', 'You might also like') }}
        </h2>
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <MenuCard
            v-for="relatedCard in related"
            :key="relatedCard.id"
            :card="relatedCard"
          />
        </div>
      </div>
    </section>
  </div>
</template>
