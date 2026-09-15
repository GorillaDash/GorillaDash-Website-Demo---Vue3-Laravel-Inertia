import type { MediaCollectionInfoResult } from '@/api/media'
import {
  getAllImagesByMediaCollectionName,
  getImageByMediaCollectionName,
  type MediaHasImgKeys
} from '@/services/mediaService'

// Any GraphQL result carrying a list of named content blocks — a website page, a
// component, a section, … Kept structural so new content-bearing types just work,
// rather than maintaining a growing union of result types.
type NamedContent = {
  name?: string | null
  value?: string | null
  media_collection?: MediaCollectionInfoResult[] | null
}
type ContentBearing = { contents?: readonly (NamedContent | null)[] | null } | null | undefined

const findContent = (name: string, data: ContentBearing) =>
  data?.contents?.find((content) => content?.name === name)

/** The `value` of the content named `name`, or null. */
export const getValueByName = (name: string, data: ContentBearing): string | null =>
  findContent(name, data)?.value ?? null

/** First image URL of the content named `name` (original_cropped, falling back to thumbnail). */
export const getImageByName = (
  name: string,
  data: ContentBearing,
  size: MediaHasImgKeys = 'original_cropped'
): string => {
  const content = findContent(name, data)
  if (!content) {
    return ''
  }

  return (
    getImageByMediaCollectionName('original_cropped', size, content.media_collection) ||
    getImageByMediaCollectionName('thumbnail', size, content.media_collection)
  )
}

/** All image URLs across every content named `name` (e.g. a gallery). */
export const getImagesByName = (
  name: string,
  data: ContentBearing,
  size: MediaHasImgKeys = 'original_cropped'
): string[] =>
  (data?.contents ?? []).flatMap((content) =>
    content && content.name === name
      ? getAllImagesByMediaCollectionName('thumbnail', size, content.media_collection)
      : []
  )
