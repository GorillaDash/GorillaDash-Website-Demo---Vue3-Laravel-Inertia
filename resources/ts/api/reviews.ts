import { toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@/composables/useQuery'
import { GetReviewsDocument, type GetReviewsQuery } from './reviews.generated'

// Sources live in ./reviews.graphql.
export type ReviewResult = NonNullable<NonNullable<GetReviewsQuery['reviews']>[number]>

export function getReviews(
  variables: MaybeRefOrGetter<{ tribeSlug?: string | null; featured?: boolean; count?: number }>
) {
  return useQuery(GetReviewsDocument, () => {
    const value = toValue(variables)

    return {
      tribeSlug: value.tribeSlug ?? null,
      featured: value.featured ?? null,
      count: value.count ?? null
    }
  })
}
