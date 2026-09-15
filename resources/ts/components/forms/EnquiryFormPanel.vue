<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useTranslate } from '@tolgee/vue'
import CmsBlock from '@/components/demo/CmsBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PhoneField from '@/components/ui/PhoneField.vue'
import { GetEnquiryFormDocument } from '@/api/forms.generated'
import { useBoundLocation } from '@/composables/useBoundLocation'
import { useEnquiry } from '@/composables/useEnquiry'
import { useQuery } from '@/composables/useQuery'
import { useTribes } from '@/composables/useTribes'
import { toUsE164 } from '@/lib/phone'

/**
 * A Gorilla Dash enquiry form, drawn from the form's own field list. Add or rename a
 * field on the form in Gorilla Dash and it appears here with no code change, which
 * is the point Structure view makes about this block.
 */
const props = withDefaults(
  defineProps<{
    formName: string
    heading: string
    intro?: string
    chooseTribe?: boolean
    submitLabel?: string
  }>(),
  { intro: '', chooseTribe: true, submitLabel: 'Send' }
)

const { t } = useTranslate()
const formSlug = props.formName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const { result } = useQuery(GetEnquiryFormDocument, { name: props.formName })
const fields = computed(() => result.value?.enquiryForm?.fields ?? [])

const { all } = useTribes()
const { slug: boundSlug } = useBoundLocation()
const contact = reactive({ firstName: '', lastName: '', email: '', mobile: '' })
const answers = reactive<Record<string, string>>({})
const flags = reactive<Record<string, boolean>>({})
const tribe = ref('')
const phoneError = ref('')

const { submit, sending, thankYou, error } = useEnquiry(formSlug)

const options = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : [])

onMounted(() => {
  tribe.value = new URLSearchParams(window.location.search).get('cafe') ?? boundSlug.value ?? ''
})

const send = async () => {
  phoneError.value = ''
  const mobile = toUsE164(contact.mobile)
  if (!mobile) {
    phoneError.value = t.value('forms.phone', 'Enter a 10 digit US phone number')
    return
  }

  await submit({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    mobile,
    fields: {
      ...answers,
      ...Object.fromEntries(
        Object.entries(flags).map(([name, value]) => [name, value ? 'Yes' : 'No'])
      )
    },
    tribes: tribe.value ? [tribe.value] : []
  })
}
</script>

<template>
  <CmsBlock
    :info="{
      module: 'Enquiry Forms',
      query: `enquiryForm(name: &quot;${formName}&quot;) · submitEnquiry(slug: &quot;${formSlug}&quot;)`,
      edit: `Enquiries › Forms › ${formName}`,
      scope: 'Organisation'
    }"
    class="rounded-card border border-brand-tint-strong bg-white p-6 sm:p-8"
  >
    <div
      v-if="thankYou"
      class="py-6 text-center"
      role="status"
    >
      <p
        class="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700"
      >
        ✓
      </p>
      <h2 class="mt-5 heading-display text-3xl text-brand-primary">
        {{ thankYou.heading || thankYou.title }}
      </h2>
      <p class="mt-3 text-muted">{{ thankYou.text }}</p>
    </div>

    <form
      v-else
      @submit.prevent="send"
    >
      <h2 class="heading-display text-3xl text-brand-primary">{{ heading }}</h2>
      <p
        v-if="intro"
        class="mt-2 text-muted"
      >
        {{ intro }}
      </p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-medium">
          {{ t('First name', 'First name') }}
          <input
            v-model.trim="contact.firstName"
            required
            autocomplete="given-name"
            class="mt-1 field"
          />
        </label>
        <label class="text-sm font-medium">
          {{ t('Last name', 'Last name') }}
          <input
            v-model.trim="contact.lastName"
            required
            autocomplete="family-name"
            class="mt-1 field"
          />
        </label>
        <label class="text-sm font-medium">
          {{ t('Email', 'Email') }}
          <input
            v-model.trim="contact.email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 field"
          />
        </label>
        <PhoneField
          v-model="contact.mobile"
          :label="t('Mobile phone', 'Mobile phone')"
          required
        />

        <label
          v-if="chooseTribe"
          class="text-sm font-medium sm:col-span-2"
        >
          {{ t('Nearest cafe', 'Nearest cafe') }}
          <select
            v-model="tribe"
            class="mt-1 field"
          >
            <option value="">{{ t('Head office', 'Head office') }}</option>
            <option
              v-for="option in all"
              :key="option.slug"
              :value="option.slug"
            >
              {{ option.name.replace(/^Hungry Gorilla\s+/i, '')
              }}{{ option.status === 'Opening Soon' ? ' (opening soon)' : '' }}
            </option>
          </select>
        </label>

        <template
          v-for="formField in fields"
          :key="formField.name ?? ''"
        >
          <label
            v-if="formField.type === 'Long Text'"
            class="text-sm font-medium sm:col-span-2"
          >
            {{ formField.name }}
            <textarea
              v-model.trim="answers[formField.name ?? '']"
              rows="4"
              class="mt-1 field"
            />
          </label>
          <label
            v-else-if="formField.type === 'List - Select One Item'"
            class="text-sm font-medium"
          >
            {{ formField.name }}
            <select
              v-model="answers[formField.name ?? '']"
              class="mt-1 field"
            >
              <option value="">{{ t('Choose one', 'Choose one') }}</option>
              <option
                v-for="option in options(formField.value)"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>
          <label
            v-else-if="formField.type === 'True/False (On/Off)'"
            class="flex items-center gap-3 text-sm font-medium"
          >
            <input
              v-model="flags[formField.name ?? '']"
              type="checkbox"
              class="size-5 rounded border-brand-tint-strong accent-brand-accent"
            />
            {{ formField.name }}
          </label>
          <label
            v-else
            class="text-sm font-medium"
          >
            {{ formField.name }}
            <input
              v-model.trim="answers[formField.name ?? '']"
              :type="formField.type === 'Number' ? 'number' : 'text'"
              class="mt-1 field"
            />
          </label>
        </template>
      </div>

      <p
        v-if="phoneError || error"
        class="mt-4 text-sm font-semibold text-red-700"
        role="alert"
      >
        {{ phoneError || error }}
      </p>

      <AppButton
        type="submit"
        size="lg"
        class="mt-6"
        :disabled="sending"
      >
        {{ sending ? t('Sending…', 'Sending…') : submitLabel }}
      </AppButton>
    </form>
  </CmsBlock>
</template>
