<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import LocaleLink from '@/components/core/LocaleLink.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import CafePicker from '@/components/order/CafePicker.vue'
import CartSummary from '@/components/order/CartSummary.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { GetPickupTimesDocument } from '@/api/foodCart.generated'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { useCart } from '@/composables/useCart'
import { usePagePaths } from '@/composables/usePagePaths'
import { APOLLO_CLIENT } from '@/composables/useQuery'
import { useTribes } from '@/composables/useTribes'
import { formatPrice, formatTime } from '@/lib/format'
import { toUsE164 } from '@/lib/phone'
import { WEEK_DAYS, weekHours } from '@/services/tribeHoursService'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()

const { page } = useWebsitePageService({ slug: props.slug })
const { pagePath } = usePagePaths()
const { all } = useTribes()
const { slug: boundSlug } = useBoundLocation()
const { cafeSlug, lines, total, busy, init, checkout } = useCart()
const client = inject(APOLLO_CLIENT)

const cafe = computed(() => all.value.find((tribe) => tribe.slug === cafeSlug.value) ?? null)

type Slot = { text: string; value: string }
const dates = ref<Array<{ value: string; label: string }>>([])
const date = ref('')
const time = ref('')
const slots = ref<Slot[]>([])
const loadingSlots = ref(false)

const form = reactive({ firstName: '', lastName: '', email: '', phone: '', comments: '' })
const error = ref('')
const placed = ref<{ name: string; cafe: string; when: string; total: number } | null>(null)

const localDate = (offset: number, timezone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(Date.now() + offset * 86400000))

const buildDates = () => {
  const timezone = cafe.value?.timezone ?? 'America/Chicago'
  dates.value = Array.from({ length: 7 }, (_, offset) => {
    const value = localDate(offset, timezone)
    const label =
      offset === 0
        ? t.value('Today', 'Today')
        : offset === 1
          ? t.value('Tomorrow', 'Tomorrow')
          : new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC'
            }).format(new Date(`${value}T12:00:00Z`))

    return { value, label }
  })
  if (!dates.value.some((option) => option.value === date.value)) {
    date.value = dates.value[0]?.value ?? ''
  }
}

const loadSlots = async () => {
  if (!client || !cafeSlug.value || !date.value) {
    slots.value = []
    return
  }
  loadingSlots.value = true
  time.value = ''
  try {
    const { data } = await client.query({
      query: GetPickupTimesDocument,
      variables: { slug: cafeSlug.value, date: date.value },
      fetchPolicy: 'network-only'
    })
    // Gorilla Dash starts today's slots from "now", even before the cafe opens, so
    // keep only times inside the cafe's hours for that weekday.
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
      new Date(`${date.value}T12:00:00Z`)
    )
    const hours = weekHours(cafe.value?.opening_hours_array)[
      WEEK_DAYS.indexOf(weekday as (typeof WEEK_DAYS)[number])
    ]
    slots.value = ((data?.foodTribeAvailableTime?.times as Slot[] | null) ?? []).filter((slot) =>
      (hours?.slots ?? []).some((open) => slot.value >= open.open && slot.value < open.close)
    )
  } catch {
    slots.value = []
  } finally {
    loadingSlots.value = false
  }
}

watch([cafeSlug, cafe], () => {
  buildDates()
  void loadSlots()
})
watch(date, () => void loadSlots())

onMounted(() => {
  void init(boundSlug.value)
  buildDates()
  void loadSlots()
})

const placeOrder = async () => {
  error.value = ''
  if (!time.value) {
    error.value = t.value('order.chooseTime', 'Choose a pickup time')
    return
  }
  const phone = toUsE164(form.phone)
  if (!phone) {
    error.value = t.value('order.phone', 'Enter a 10 digit US phone number')
    return
  }

  const summary = {
    name: form.firstName,
    cafe: cafe.value?.name ?? '',
    when: `${dates.value.find((option) => option.value === date.value)?.label ?? date.value}, ${formatTime(time.value)}`,
    total: total.value
  }

  try {
    await checkout({ ...form, phone, date: date.value, time: time.value })
    placed.value = summary
  } catch {
    error.value = t.value('order.failed', 'We could not place your order. Please try again')
  }
}
</script>

<template>
  <div>
    <SeoHead
      :title="page?.meta_title ?? ''"
      :description="page?.meta_description ?? ''"
      noindex
    />

    <section class="container py-12">
      <h1 class="heading-display text-4xl text-brand-primary sm:text-5xl">
        {{ getValueByName('Hero Heading', page) || t('Your order', 'Your order') }}
      </h1>

      <div
        v-if="placed"
        class="mx-auto mt-10 max-w-2xl rounded-card border border-brand-tint-strong bg-white p-10 text-center"
        role="status"
      >
        <p
          class="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700"
        >
          ✓
        </p>
        <h2 class="mt-6 heading-display text-3xl text-brand-primary">
          {{ t('order.thanks', 'Thanks, {name}. Your order is in.', { name: placed.name }) }}
        </h2>
        <p class="mt-3 text-lg text-muted">
          {{
            t(
              'order.pickup',
              'Pick it up from {cafe} on {when}. You will pay {total} at the counter.',
              { cafe: placed.cafe, when: placed.when, total: formatPrice(placed.total) }
            )
          }}
        </p>
        <p class="mt-6 rounded-xl bg-brand-tint p-4 text-sm text-muted">
          {{
            t(
              'order.demoNote',
              'This order has just been created in Gorilla Dash as a pickup order, with the customer added to People.'
            )
          }}
        </p>
        <AppButton
          :href="pagePath('menu')"
          class="mt-8"
        >
          {{ t('Back to the menu', 'Back to the menu') }}
        </AppButton>
      </div>

      <div
        v-else
        class="mt-8 grid gap-10 lg:grid-cols-12"
      >
        <CmsBlock
          :info="{
            module: 'Online Ordering',
            query: 'foodTribeAvailableTime · submitFoodShoppingCart',
            edit: 'Food › Orders and Tribe › Store Settings',
            scope: 'Tribe'
          }"
          as="form"
          class="space-y-8 lg:col-span-7"
          @submit.prevent="placeOrder"
        >
          <div class="rounded-card border border-brand-tint-strong bg-white p-6">
            <h2 class="heading-display text-2xl text-brand-primary">
              1. {{ t('Pickup from', 'Pickup from') }}
            </h2>
            <div class="mt-4"><CafePicker /></div>
            <p
              v-if="cafe"
              class="mt-3 text-sm text-muted"
            >
              {{ cafe.address_1 }}, {{ cafe.locality }}, {{ cafe.state_abbreviated }} ·
              {{ cafe.main_telephone }}
            </p>
          </div>

          <div class="rounded-card border border-brand-tint-strong bg-white p-6">
            <h2 class="heading-display text-2xl text-brand-primary">
              2. {{ t('Pickup time', 'Pickup time') }}
            </h2>
            <div class="mt-4 flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="option in dates"
                :key="option.value"
                type="button"
                class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium"
                :class="
                  date === option.value
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-brand-tint-strong hover:border-brand-primary'
                "
                @click="date = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <div class="mt-4">
              <p
                v-if="loadingSlots"
                class="text-sm text-muted"
              >
                {{ t('Checking available times…', 'Checking available times…') }}
              </p>
              <p
                v-else-if="!slots.length"
                class="text-sm text-muted"
              >
                {{ t('order.noSlots', 'No pickup times left on this day. Try another day.') }}
              </p>
              <div
                v-else
                class="grid grid-cols-3 gap-2 sm:grid-cols-5"
              >
                <button
                  v-for="slot in slots"
                  :key="slot.value"
                  type="button"
                  class="rounded-lg border px-2 py-2 text-sm"
                  :class="
                    time === slot.value
                      ? 'border-brand-accent bg-brand-accent text-brand-on-accent'
                      : 'border-brand-tint-strong hover:border-brand-primary'
                  "
                  @click="time = slot.value"
                >
                  {{ formatTime(slot.value) }}
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-card border border-brand-tint-strong bg-white p-6">
            <h2 class="heading-display text-2xl text-brand-primary">
              3. {{ t('Your details', 'Your details') }}
            </h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <label class="text-sm font-medium">
                {{ t('First name', 'First name') }}
                <input
                  v-model.trim="form.firstName"
                  required
                  autocomplete="given-name"
                  class="mt-1 field"
                />
              </label>
              <label class="text-sm font-medium">
                {{ t('Last name', 'Last name') }}
                <input
                  v-model.trim="form.lastName"
                  required
                  autocomplete="family-name"
                  class="mt-1 field"
                />
              </label>
              <label class="text-sm font-medium">
                {{ t('Email', 'Email') }}
                <input
                  v-model.trim="form.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="mt-1 field"
                />
              </label>
              <label class="text-sm font-medium">
                {{ t('Mobile phone', 'Mobile phone') }}
                <span class="mt-1 flex">
                  <span
                    class="inline-flex items-center rounded-l-lg border border-r-0 border-brand-tint-strong bg-brand-tint px-3 text-sm whitespace-nowrap"
                    >🇺🇸 +1</span
                  >
                  <input
                    v-model.trim="form.phone"
                    type="tel"
                    required
                    autocomplete="tel-national"
                    placeholder="(512) 555-0123"
                    class="field rounded-l-none"
                  />
                </span>
              </label>
              <label class="text-sm font-medium sm:col-span-2">
                {{ t('Notes for the kitchen', 'Notes for the kitchen') }}
                <textarea
                  v-model.trim="form.comments"
                  rows="2"
                  class="mt-1 field"
                />
              </label>
            </div>
          </div>

          <div>
            <p
              v-if="error"
              class="mb-3 text-sm font-semibold text-red-700"
              role="alert"
            >
              {{ error }}
            </p>
            <AppButton
              type="submit"
              size="lg"
              :disabled="busy || !lines.length"
              class="w-full sm:w-auto"
            >
              {{
                busy
                  ? t('Placing order…', 'Placing order…')
                  : t('order.place', 'Place order · pay at pickup · {total}', {
                      total: formatPrice(total)
                    })
              }}
            </AppButton>
            <p class="mt-3 text-xs text-muted">
              {{
                t(
                  'order.paymentNote',
                  'Card payment turns on when Stripe keys are added to the cafe in Gorilla Dash.'
                )
              }}
            </p>
          </div>
        </CmsBlock>

        <aside class="lg:col-span-5">
          <div class="sticky top-36">
            <CartSummary
              editable
              :show-checkout="false"
            />
            <p class="mt-4 text-sm">
              <LocaleLink
                :href="pagePath('menu')"
                class="font-semibold text-brand-primary hover:underline"
                >← {{ t('Add more items', 'Add more items') }}</LocaleLink
              >
            </p>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>
