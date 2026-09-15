import type { Ref } from 'vue'
import { useQuery } from '@/composables/useQuery'
import {
  GetArticleCategoriesDocument,
  GetArticleDocument,
  GetArticlesByCategoriesDocument
} from './article.generated'

/**
 * GD CMS articles — the news / press / blog collection.
 *
 * One collection serves every editorial list on a site; a page picks its slice by
 * CATEGORY (e.g. `['In The News']`, `['Blog']`), so an archive page is a category name
 * plus a page number, not its own API.
 */
export type ArticlePaginationType = {
  categories: string[]
  itemsPerPage: number
  page: number
}

export function getArticlesByCategories(variables: Ref<ArticlePaginationType>) {
  return useQuery(GetArticlesByCategoriesDocument, () => variables.value)
}

export function getArticle(slug: string) {
  return useQuery(GetArticleDocument, { slug })
}

export function getArticleCategories() {
  return useQuery(GetArticleCategoriesDocument)
}
