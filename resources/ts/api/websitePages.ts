import { useLocale } from '@/composables/useLocale'
import { useQuery } from '@/composables/useQuery'
import {
  GetWebsitePageDocument,
  WebsitePageContentInfoFragmentDoc,
  WebsitePageInfoFragmentDoc
} from './websitePages.generated'
import type { ResultOf } from '@graphql-typed-document-node/core'

// Sources live in ./websitePages.graphql. Import the generated
// consts directly instead of the `graphql()` helper — see codegen.ts for why.
export const websitePageContentFragment = WebsitePageContentInfoFragmentDoc
export const websitePageFragment = WebsitePageInfoFragmentDoc

export type WebsitePageInfoResult = ResultOf<typeof websitePageFragment>

// ponytail: ported only getWebsitePage. The old file also had custom / industry /
// tribe / list variants — re-add those from the old api/websitePages.ts if a page needs them.
//
// `locale` is the GD content language, taken from the request's locale so callers can't
// forget it. GD returns the default language for an unknown or null locale, so a market
// whose CMS has no translations behaves exactly as before.
export function getWebsitePage(slug: string) {
  const { locale } = useLocale()

  return useQuery(GetWebsitePageDocument, { slug, locale: locale.value })
}
