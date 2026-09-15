import { useQuery } from '@/composables/useQuery'
import { GetFaqsDocument } from './faq.generated'

// Sources live in ./faq.graphql.
export function getFaqs() {
  return useQuery(GetFaqsDocument)
}
