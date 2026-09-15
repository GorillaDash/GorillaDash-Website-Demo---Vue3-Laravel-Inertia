import { useLocale } from '@/composables/useLocale'
import { useQuery } from '@/composables/useQuery'
import {
  ComponentInfoFragmentDoc,
  GetWebsiteComponentsDocument
} from './websiteComponents.generated'
import type { ResultOf } from '@graphql-typed-document-node/core'

// Sources live in ./websiteComponents.graphql. Import the generated
// consts directly instead of the `graphql()` helper — see codegen.ts for why.
export const componentFragment = ComponentInfoFragmentDoc

export type ComponentInfoResult = ResultOf<typeof componentFragment>

export function getWebsiteComponents(name: string[], status = 'Active') {
  const { locale } = useLocale()

  return useQuery(GetWebsiteComponentsDocument, { name, status, locale: locale.value })
}
