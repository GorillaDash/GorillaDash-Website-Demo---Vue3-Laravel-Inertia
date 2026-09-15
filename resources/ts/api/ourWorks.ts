import { toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@/composables/useQuery'
import {
  GetOrganisationOurWorkDocument,
  GetOrganisationOurWorksDocument,
  GetTribeOurWorksDocument,
  type OurWorkInfoFragment
} from './ourWorks.generated'

// Sources live in ./ourWorks.graphql.
export type OurWorkInfoResult = OurWorkInfoFragment

/** Organisation-level Our Work posts (tribe_id null in Gorilla Dash). */
export function getOrganisationOurWorks(variables: {
  page: number
  itemsPerPage: number
  featured?: boolean
}) {
  return useQuery(GetOrganisationOurWorksDocument, {
    ...variables,
    featured: variables.featured ?? null
  })
}

export function getOrganisationOurWork(slug: string) {
  return useQuery(GetOrganisationOurWorkDocument, { slug })
}

/** One tribe's own Our Work posts. */
export function getTribeOurWorks(tribeSlug: MaybeRefOrGetter<string>, itemsPerPage = 6) {
  return useQuery(GetTribeOurWorksDocument, () => ({
    tribeSlug: toValue(tribeSlug),
    page: 1,
    itemsPerPage
  }))
}
