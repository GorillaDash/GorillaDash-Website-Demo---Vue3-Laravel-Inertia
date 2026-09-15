<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { useTranslate } from '@tolgee/vue'
import SeoHead from '@/components/core/SeoHead.vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import TribeOpenBadge from '@/components/tribe/TribeOpenBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import PhoneField from '@/components/ui/PhoneField.vue'
import { GetAppointmentTimesDocument, SubmitAppointmentDocument } from '@/api/forms.generated'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { APOLLO_CLIENT } from '@/composables/useQuery'
import { useTribes } from '@/composables/useTribes'
import { photo } from '@/lib/demoImagery'
import { formatTime } from '@/lib/format'
import { milesBetween } from '@/lib/geo'
import { toUsE164 } from '@/lib/phone'
import { localNow, weekHours, WEEK_DAYS } from '@/services/tribeHoursService'
import { getValueByName } from '@/services/websiteContentValue'
import { useWebsitePageService } from '@/services/websitePageService'

const { t } = useTranslate()
const props = defineProps<{ slug: string }>()
const client = inject(APOLLO_CLIENT)

const { page } = useWebsitePageService({ slug: props.slug })
const field = (name: string) => getValueByName(name, page.value) ?? ''

/**
 * The stepper's services are Gorilla Dash appointment types, referenced by their
 * exact names; the durations shown here match the types' default durations.
 */
const SERVICES = [
  {
    type: 'Catering Consultation',
    minutes: 30,
    icon: '☕',
    description: 'Talk through your event, guest count and budget with a catering lead.'
  },
  {
    type: 'Tasting Session',
    minutes: 45,
    icon: '🍽',
    description: 'Taste the dishes you are considering before you choose your menu.'
  },
  {
    type: 'Event Walkthrough',
    minutes: 60,
    icon: '📋',
    description: 'Walk the venue with us to plan setup, service and timing.'
  }
]

const STEPS = ['What you need', 'Where you are', 'When', 'Your details', 'Confirm']

const step = ref(0)
const service = ref<(typeof SERVICES)[number] | null>(null)
const cafeSlug = ref<string | null>(null)
const date = ref('')
const time = ref('')
const details = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  guests: '',
  notes: ''
})
const origin = ref<{ lat: number; lng: number } | null>(null)
const error = ref('')
const submitting = ref(false)
const booked = ref(false)

const { trading } = useTribes()
const { slug: boundSlug } = useBoundLocation()

const cafe = computed(() => trading.value.find((tribe) => tribe.slug === cafeSlug.value) ?? null)
const cafes = computed(() =>
  trading.value
    .map((tribe) => ({
      tribe,
      distance:
        origin.value && tribe.latitude
          ? milesBetween(origin.value, {
              lat: Number(tribe.latitude),
              lng: Number(tribe.longitude)
            })
          : null
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
)

const dates = computed(() => {
  const timezone = cafe.value?.timezone ?? 'America/Chicago'
  const week = weekHours(cafe.value?.opening_hours_array)

  return Array.from({ length: 14 }, (_, offset) => {
    const moment = new Date(Date.now() + offset * 86400000)
    const value = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(moment)
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    }).format(moment)
    const open =
      (week[WEEK_DAYS.indexOf(weekday as (typeof WEEK_DAYS)[number])]?.slots.length ?? 0) > 0

    return {
      value,
      open,
      day: new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(
        moment
      ),
      number: new Intl.DateTimeFormat('en-US', { timeZone: timezone, day: 'numeric' }).format(
        moment
      ),
      month: new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'short' }).format(moment)
    }
  })
})

type Slot = { enable: boolean; text: string; value: string }
const slots = ref<Slot[]>([])
const loadingSlots = ref(false)

const loadSlots = async () => {
  if (!client || !cafeSlug.value || !service.value || !date.value) {
    return
  }
  loadingSlots.value = true
  time.value = ''
  try {
    const { data } = await client.query({
      query: GetAppointmentTimesDocument,
      variables: { slug: cafeSlug.value, type: service.value.type, date: date.value },
      fetchPolicy: 'network-only'
    })
    const now = localNow(cafe.value?.timezone)
    const isToday = date.value === dates.value[0]?.value
    slots.value = ((data?.appointmentAvailableTime?.times as Slot[] | null) ?? []).filter(
      (slot) => !isToday || slot.value > now.time
    )
  } catch {
    slots.value = []
  } finally {
    loadingSlots.value = false
  }
}

watch([date, cafeSlug, service], () => void loadSlots())

const whenLabel = computed(() => {
  const option = dates.value.find((candidate) => candidate.value === date.value)

  return option && time.value
    ? `${option.day} ${option.month} ${option.number} at ${formatTime(time.value)}`
    : ''
})

const canContinue = computed(() => {
  switch (step.value) {
    case 0:
      return service.value !== null
    case 1:
      return cafe.value !== null
    case 2:
      return Boolean(date.value && time.value)
    case 3:
      return Boolean(details.firstName && details.lastName && details.email && details.phone)
    default:
      return true
  }
})

const next = () => {
  error.value = ''
  if (step.value === 3 && !toUsE164(details.phone)) {
    error.value = t.value('book.phone', 'Enter a 10 digit US phone number')
    return
  }
  if (step.value === 2 && !date.value) {
    return
  }
  step.value = Math.min(step.value + 1, STEPS.length - 1)
}

const chooseService = (option: (typeof SERVICES)[number]) => {
  service.value = option
  step.value = cafeSlug.value ? 2 : 1
}

const chooseCafe = (slug: string) => {
  cafeSlug.value = slug
  date.value = dates.value.find((option) => option.open)?.value ?? ''
  step.value = 2
}

const locate = () => {
  navigator.geolocation?.getCurrentPosition((position) => {
    origin.value = { lat: position.coords.latitude, lng: position.coords.longitude }
  })
}

const confirm = async () => {
  if (!client || !service.value || !cafeSlug.value) {
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await client.mutate({
      mutation: SubmitAppointmentDocument,
      variables: {
        slug: cafeSlug.value,
        type: service.value.type,
        datetime: `${date.value} ${time.value}`,
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: toUsE164(details.phone) ?? details.phone,
        comments: details.notes || null,
        data: JSON.stringify({
          guests: details.guests || null,
          booked_from: 'Juniper Table website'
        })
      }
    })
    booked.value = true
  } catch {
    error.value = t.value(
      'book.failed',
      'We could not book that time. Please choose another time and try again'
    )
  } finally {
    submitting.value = false
  }
}

/** An .ics file for the visitor's calendar, built in the browser. */
const calendarHref = computed(() => {
  if (!booked.value || !service.value || !cafe.value) {
    return ''
  }
  const stamp = `${date.value.replaceAll('-', '')}T${time.value.replace(':', '')}00`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART;TZID=${cafe.value.timezone}:${stamp}`,
    `SUMMARY:${service.value.type} at ${cafe.value.name}`,
    `LOCATION:${cafe.value.address_1}, ${cafe.value.locality}, ${cafe.value.state_abbreviated}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
})

onMounted(() => {
  const requested = new URLSearchParams(window.location.search).get('cafe')
  const preferred = requested ?? boundSlug.value
  if (preferred) {
    cafeSlug.value = preferred
  }
})

watch(trading, () => {
  if (cafeSlug.value && !date.value) {
    date.value = dates.value.find((option) => option.open)?.value ?? ''
  }
})
</script>

<template>
  <div>
    <SeoHead
      :title="page?.meta_title ?? ''"
      :description="page?.meta_description ?? ''"
    />

    <PageHero
      :title="field('Hero Heading')"
      :subtitle="field('Hero Subheading')"
      :image="photo('cateringTable', 1800)"
      detail='websitePage(slug: "book")'
    />

    <CmsBlock
      :info="{
        module: 'Appointments',
        query: 'appointmentAvailableTime · submitAppointment',
        edit: 'Tribe › Appointments (types in Settings › Appointment Types)',
        scope: 'Tribe'
      }"
      as="section"
      class="container py-12"
    >
      <div class="mx-auto max-w-4xl">
        <ol
          v-if="!booked"
          class="mb-10 grid grid-cols-5 gap-2"
          :aria-label="t('Booking progress', 'Booking progress')"
        >
          <li
            v-for="(label, index) in STEPS"
            :key="label"
            class="flex flex-col gap-2"
            :aria-current="index === step ? 'step' : undefined"
          >
            <span
              class="h-1.5 rounded-full transition-colors"
              :class="index <= step ? 'bg-brand-accent' : 'bg-brand-tint-strong'"
            />
            <span
              class="hidden text-xs font-semibold sm:block"
              :class="index === step ? 'text-brand-primary' : 'text-muted'"
              >{{ index + 1 }}. {{ t(label, label) }}</span
            >
          </li>
        </ol>

        <div class="rounded-card border border-brand-tint-strong bg-white p-6 sm:p-10">
          <!-- Success -->
          <div
            v-if="booked"
            class="text-center"
            role="status"
          >
            <p
              class="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700"
            >
              ✓
            </p>
            <h2 class="mt-6 heading-display text-3xl text-brand-primary">
              {{ t('book.done', 'You are booked in, {name}.', { name: details.firstName }) }}
            </h2>
            <p class="mt-3 text-lg text-muted">
              {{ service?.type }} · {{ cafe?.name }} · {{ whenLabel }}
            </p>
            <p class="mx-auto mt-6 max-w-lg rounded-xl bg-brand-tint p-4 text-sm text-muted">
              {{
                t(
                  'book.demoNote',
                  'The appointment is now in Gorilla Dash on this cafe’s calendar, with the visitor matched to or created as a person.'
                )
              }}
            </p>
            <div class="mt-8 flex flex-wrap justify-center gap-3">
              <AppButton
                :href="calendarHref"
                external
                variant="dark"
              >
                {{ t('Add to calendar', 'Add to calendar') }}
              </AppButton>
              <AppButton href="/">{{ t('Back to home', 'Back to home') }}</AppButton>
            </div>
          </div>

          <!-- Step 1: service -->
          <div v-else-if="step === 0">
            <h2 class="heading-display text-3xl text-brand-primary">
              {{ t('What do you need?', 'What do you need?') }}
            </h2>
            <div class="mt-6 grid gap-4 md:grid-cols-3">
              <button
                v-for="option in SERVICES"
                :key="option.type"
                type="button"
                class="flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition hover:border-brand-accent hover:shadow-md"
                :class="
                  service?.type === option.type
                    ? 'border-brand-accent ring-2 ring-brand-accent/30'
                    : 'border-brand-tint-strong'
                "
                @click="chooseService(option)"
              >
                <span
                  class="text-3xl"
                  aria-hidden="true"
                  >{{ option.icon }}</span
                >
                <span class="heading-display text-xl text-brand-primary">{{ option.type }}</span>
                <span class="text-sm text-muted">{{ option.description }}</span>
                <span
                  class="mt-auto rounded-full bg-brand-tint px-3 py-1 text-xs font-semibold text-brand-primary"
                  >{{ option.minutes }} {{ t('minutes', 'minutes') }}</span
                >
              </button>
            </div>
          </div>

          <!-- Step 2: where -->
          <div v-else-if="step === 1">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="heading-display text-3xl text-brand-primary">
                {{ t('Where are you?', 'Where are you?') }}
              </h2>
              <AppButton
                variant="outline"
                size="sm"
                @click="locate"
              >
                {{ t('Use my location', 'Use my location') }}
              </AppButton>
            </div>
            <div class="mt-6 grid gap-3 md:grid-cols-2">
              <button
                v-for="option in cafes"
                :key="option.tribe.slug"
                type="button"
                class="flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-brand-accent"
                :class="
                  cafeSlug === option.tribe.slug
                    ? 'border-brand-accent ring-2 ring-brand-accent/30'
                    : 'border-brand-tint-strong'
                "
                @click="chooseCafe(option.tribe.slug)"
              >
                <IconMapPin class="mt-1 size-5 shrink-0 text-brand-accent" />
                <span class="flex-1">
                  <span class="block font-semibold text-brand-primary">{{
                    option.tribe.name.replace(/^Juniper Table\s+/i, '')
                  }}</span>
                  <span class="block text-sm text-muted"
                    >{{ option.tribe.locality }}, {{ option.tribe.state_abbreviated }}</span
                  >
                  <span class="mt-2 block">
                    <TribeOpenBadge
                      :hours="option.tribe.opening_hours_array"
                      :timezone="option.tribe.timezone"
                    />
                  </span>
                </span>
                <span
                  v-if="option.distance !== null"
                  class="text-xs text-muted"
                  >{{ Math.round(option.distance) }} mi</span
                >
              </button>
            </div>
          </div>

          <!-- Step 3: when -->
          <div v-else-if="step === 2">
            <h2 class="heading-display text-3xl text-brand-primary">
              {{ t('When suits you?', 'When suits you?') }}
            </h2>
            <p class="mt-1 text-muted">{{ service?.type }} · {{ cafe?.name }}</p>
            <div class="mt-6 flex gap-2 overflow-x-auto pb-2">
              <button
                v-for="option in dates"
                :key="option.value"
                type="button"
                :disabled="!option.open"
                class="flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                :class="
                  date === option.value
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-brand-tint-strong hover:border-brand-primary'
                "
                @click="date = option.value"
              >
                <span class="text-xs uppercase">{{ option.day }}</span>
                <span class="heading-display text-2xl">{{ option.number }}</span>
                <span class="text-xs">{{ option.month }}</span>
              </button>
            </div>
            <div class="mt-6">
              <p
                v-if="loadingSlots"
                class="text-muted"
              >
                {{ t('Finding times…', 'Finding times…') }}
              </p>
              <p
                v-else-if="!slots.length"
                class="text-muted"
              >
                {{ t('book.noSlots', 'No times left on this day. Please pick another day.') }}
              </p>
              <div
                v-else
                class="grid grid-cols-3 gap-2 sm:grid-cols-5"
              >
                <button
                  v-for="slot in slots"
                  :key="slot.value"
                  type="button"
                  :disabled="!slot.enable"
                  class="rounded-lg border px-2 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
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

          <!-- Step 4: details -->
          <form
            v-else-if="step === 3"
            id="booking-details"
            @submit.prevent="next"
          >
            <h2 class="heading-display text-3xl text-brand-primary">
              {{ t('Your details', 'Your details') }}
            </h2>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <label class="text-sm font-medium">
                {{ t('First name', 'First name') }}
                <input
                  v-model.trim="details.firstName"
                  required
                  autocomplete="given-name"
                  class="mt-1 field"
                />
              </label>
              <label class="text-sm font-medium">
                {{ t('Last name', 'Last name') }}
                <input
                  v-model.trim="details.lastName"
                  required
                  autocomplete="family-name"
                  class="mt-1 field"
                />
              </label>
              <label class="text-sm font-medium">
                {{ t('Email', 'Email') }}
                <input
                  v-model.trim="details.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="mt-1 field"
                />
              </label>
              <PhoneField
                v-model="details.phone"
                :label="t('Mobile phone', 'Mobile phone')"
                required
              />
              <label class="text-sm font-medium">
                {{ t('Expected guests', 'Expected guests') }}
                <select
                  v-model="details.guests"
                  class="mt-1 field"
                >
                  <option value="">{{ t('Not sure yet', 'Not sure yet') }}</option>
                  <option
                    v-for="range in ['10 – 25', '25 – 50', '50 – 100', '100 – 250', '250+']"
                    :key="range"
                    :value="range"
                  >
                    {{ range }}
                  </option>
                </select>
              </label>
              <label class="text-sm font-medium sm:col-span-2">
                {{ t('Tell us about your event', 'Tell us about your event') }}
                <textarea
                  v-model.trim="details.notes"
                  rows="3"
                  class="mt-1 field"
                />
              </label>
            </div>
          </form>

          <!-- Step 5: confirm -->
          <div v-else>
            <h2 class="heading-display text-3xl text-brand-primary">
              {{ t('Check and confirm', 'Check and confirm') }}
            </h2>
            <dl class="mt-6 divide-y divide-brand-tint rounded-2xl border border-brand-tint-strong">
              <div
                v-for="row in [
                  {
                    label: t('Appointment', 'Appointment'),
                    value: `${service?.type} (${service?.minutes} min)`,
                    step: 0
                  },
                  { label: t('Cafe', 'Cafe'), value: cafe?.name ?? '', step: 1 },
                  { label: t('When', 'When'), value: whenLabel, step: 2 },
                  {
                    label: t('Contact', 'Contact'),
                    value: `${details.firstName} ${details.lastName} · ${details.email} · ${details.phone}`,
                    step: 3
                  }
                ]"
                :key="row.label"
                class="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
              >
                <dt class="w-32 text-sm text-muted">{{ row.label }}</dt>
                <dd class="flex-1 font-medium text-brand-primary">{{ row.value }}</dd>
                <button
                  type="button"
                  class="text-sm font-semibold text-brand-accent hover:underline"
                  @click="step = row.step"
                >
                  {{ t('Change', 'Change') }}
                </button>
              </div>
            </dl>
          </div>

          <!-- Navigation -->
          <div
            v-if="!booked"
            class="mt-8 flex items-center justify-between gap-3 border-t border-brand-tint pt-6"
          >
            <button
              v-if="step > 0"
              type="button"
              class="font-semibold text-brand-primary hover:underline"
              @click="step--"
            >
              ← {{ t('Back', 'Back') }}
            </button>
            <span v-else />
            <p
              v-if="error"
              class="text-sm font-semibold text-red-700"
              role="alert"
            >
              {{ error }}
            </p>
            <AppButton
              v-if="step === 4"
              size="lg"
              :disabled="submitting"
              @click="confirm"
            >
              {{ submitting ? t('Booking…', 'Booking…') : t('Confirm booking', 'Confirm booking') }}
            </AppButton>
            <AppButton
              v-else-if="step === 3"
              type="submit"
              form="booking-details"
              size="lg"
            >
              {{ t('Continue', 'Continue') }}
            </AppButton>
            <AppButton
              v-else-if="step > 0"
              size="lg"
              :disabled="!canContinue"
              @click="next"
            >
              {{ t('Continue', 'Continue') }}
            </AppButton>
          </div>
        </div>
      </div>
    </CmsBlock>
  </div>
</template>
