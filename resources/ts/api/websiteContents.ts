import { toValue, type MaybeRefOrGetter } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useQuery } from '@/composables/useQuery'
import {
  GetWebsiteSectionDocument,
  WebsiteContentInfoFragmentDoc,
  WebsiteSectionInfoFragmentDoc
} from './websiteContents.generated'
import type { ResultOf } from '@graphql-typed-document-node/core'

// Sources live in ./websiteContents.graphql. Import the generated
// consts directly instead of the `graphql()` helper — see codegen.ts for why.
export const websiteContentFragment = WebsiteContentInfoFragmentDoc
export const websiteSectionFragment = WebsiteSectionInfoFragmentDoc

export type WebsiteSectionInfoResult = ResultOf<typeof websiteSectionFragment>
export type WebsiteContentInfoResult = ResultOf<typeof websiteContentFragment>

/**
 * A named website section and its contents.
 *
 * `locale` is the GD content language. It defaults to the request's locale, so callers
 * can't forget it; pass one explicitly only to pin a section to a fixed language.
 */
export function getWebsiteSection(name: string, locale?: MaybeRefOrGetter<string | null>) {
  const { locale: active } = useLocale()

  return useQuery(GetWebsiteSectionDocument, () => ({
    name,
    locale: toValue(locale) ?? active.value
  }))
}
