import { useLocale } from '@/composables/useLocale'
import { useQuery } from '@/composables/useQuery'
import { GetFoodMenuDocument, type GetFoodMenuQuery } from './foodMenus.generated'

// Sources live in ./foodMenus.graphql.
export type FoodMenuResult = GetFoodMenuQuery['foodMenu']
export type FoodMenuSectionResult = NonNullable<FoodMenuResult['foodMenuSections']>[number]
export type FoodMenuListItemResult = FoodMenuSectionResult['foodMenuListItems'][number]
export type FoodMenuItemResult = FoodMenuListItemResult['foodMenuItems'][number]

/** An organisation food menu by its name in Gorilla Dash ("Website Menu", "Catering Menu"). */
export function getFoodMenu(name: string) {
  const { locale } = useLocale()

  return useQuery(GetFoodMenuDocument, { name, locale: locale.value })
}
