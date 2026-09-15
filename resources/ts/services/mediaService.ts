import type { MediaCollectionInfoResult, MediaInfoResult } from '@/api/media'

// The image-URL variants on a Media (excludes non-URL fields like alt_tag/approved).
export type MediaHasImgKeys = keyof Pick<
  MediaInfoResult,
  'banner' | 'default' | 'original_cropped' | 'portrait' | 'rectangle' | 'square' | 'thumbnail'
>

type MediaCollections = MediaCollectionInfoResult[] | null | undefined

const findCollection = (name: string, collections: MediaCollections) =>
  collections?.find((collection) => collection.name === name)

/** Every `size` image URL in the named media collection (empty if none). */
export const getAllImagesByMediaCollectionName = (
  mediaCollectionName: string,
  size: MediaHasImgKeys,
  mediaCollections: MediaCollections
): string[] =>
  findCollection(mediaCollectionName, mediaCollections)?.media.map((media) => media[size] || '') ??
  []

/** First `size` image URL in the named media collection (empty if none). */
export const getImageByMediaCollectionName = (
  mediaCollectionName: string,
  size: MediaHasImgKeys,
  mediaCollections: MediaCollections
): string => findCollection(mediaCollectionName, mediaCollections)?.media[0]?.[size] || ''
