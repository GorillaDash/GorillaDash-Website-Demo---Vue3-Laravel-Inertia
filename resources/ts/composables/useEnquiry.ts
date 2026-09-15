import { inject, ref } from 'vue'
import { SubmitEnquiryDocument } from '@/api/forms.generated'
import { APOLLO_CLIENT } from '@/composables/useQuery'

/**
 * Sends one Gorilla Dash enquiry form. The form is named by its slug (contact-us,
 * catering-quote, franchise-enquiry) and every answer is a {name, value} pair that
 * Gorilla Dash matches to the form's fields by name.
 */
export function useEnquiry(slug: string) {
  const client = inject(APOLLO_CLIENT)
  const sending = ref(false)
  const thankYou = ref<{ title: string; heading: string; text: string } | null>(null)
  const error = ref('')

  const submit = async (enquiry: {
    firstName: string
    lastName: string
    email: string
    mobile: string
    fields: Record<string, string | number | boolean>
    tribes?: string[]
  }): Promise<boolean> => {
    if (!client) {
      return false
    }

    sending.value = true
    error.value = ''
    try {
      const { data } = await client.mutate({
        mutation: SubmitEnquiryDocument,
        variables: {
          slug,
          firstName: enquiry.firstName,
          lastName: enquiry.lastName,
          email: enquiry.email,
          mobile: enquiry.mobile,
          fields: Object.entries(enquiry.fields).map(([name, value]) => ({ name, value })),
          tribes: enquiry.tribes ?? [],
          submitUrl: typeof window === 'undefined' ? null : window.location.href
        }
      })
      const [title = '', heading = '', text = ''] = (data?.submitEnquiry ?? []).map(
        (value) => value ?? ''
      )
      thankYou.value = { title, heading, text }

      return true
    } catch {
      error.value = 'We could not send your message. Please try again.'

      return false
    } finally {
      sending.value = false
    }
  }

  return { submit, sending, thankYou, error }
}
