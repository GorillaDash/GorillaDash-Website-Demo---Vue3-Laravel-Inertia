import { computed } from 'vue'
import { getFoodMenu, type FoodMenuItemResult, type FoodMenuListItemResult } from '@/api/foodMenus'
import { menuPhoto } from '@/lib/demoImagery'

export type MenuCard = {
  id: number
  name: string
  slug: string
  sectionSlug: string
  sectionName: string
  description: string
  fromPrice: number
  hasVariants: boolean
  items: FoodMenuItemResult[]
  image: string
}

export type MenuSection = {
  name: string
  slug: string
  description: string
  cards: MenuCard[]
}

const toCard = (
  item: FoodMenuListItemResult,
  section: { name: string; slug: string }
): MenuCard => {
  const items = [...item.foodMenuItems]
  const prices = items.map((menuItem) => menuItem.price).filter((price) => price > 0)

  return {
    id: item.id,
    name: item.name ?? '',
    slug: item.slug,
    sectionSlug: section.slug,
    sectionName: section.name,
    description: item.description ?? '',
    fromPrice: prices.length ? Math.min(...prices) : 0,
    hasVariants: items.length > 1,
    items,
    image: menuPhoto(item.name ?? '')
  }
}

/** A Gorilla Dash food menu shaped for the site: sections in menu order, cards in section order. */
export function useFoodMenuService(name: string) {
  const { result, loading } = getFoodMenu(name)

  const sections = computed<MenuSection[]>(() =>
    [...(result.value?.foodMenu.foodMenuSections ?? [])]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((section) => {
        const meta = { name: section.name ?? '', slug: section.slug }

        return {
          ...meta,
          description: section.description ?? '',
          cards: [...section.foodMenuListItems]
            .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
            .map((item) => toCard(item, meta))
        }
      })
  )

  const cards = computed(() => sections.value.flatMap((section) => section.cards))

  return { sections, cards, loading }
}
