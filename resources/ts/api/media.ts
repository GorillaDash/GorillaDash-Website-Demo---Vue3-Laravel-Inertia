import { MediaCollectionInfoFragmentDoc, MediaInfoFragmentDoc } from './media.generated'
import type { ResultOf } from '@graphql-typed-document-node/core'

// Sources live in ./media.graphql. Import the generated consts
// directly instead of the `graphql()` helper — see codegen.ts for why.
export const mediaCollectionFragment = MediaCollectionInfoFragmentDoc
export const mediaFragment = MediaInfoFragmentDoc

export type MediaCollectionInfoResult = ResultOf<typeof mediaCollectionFragment>
export type MediaInfoResult = ResultOf<typeof mediaFragment>
