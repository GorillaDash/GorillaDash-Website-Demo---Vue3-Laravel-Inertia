import { computed } from 'vue'
import { getWebsiteMenu } from '@/api/websiteMenus'
import { mapMenu, type WebsiteMenuType } from '@/services/websiteMenus/transformer'
import { SupportCountryName, type ByCountry } from '@/stores/countryLimits'
import { useCountryValue } from '@/composables/useCountryValue'

// The GD CMS names the same menu differently per market, so callers pass a
// country -> menu-name map. USA is the fallback when the current market is missing.
export type MenuNameByCountry = ByCountry<string>

// Header "Main Menu". Add entries (e.g. [SupportCountryName.CANADA, '...']) per market.
const MAIN_MENU_NAMES: MenuNameByCountry = new Map([[SupportCountryName.USA, 'Main Menu']])

// Apollo is provided app-wide via APOLLO_CLIENT (app.ts), so useQuery injects the
// client automatically — call inside <script setup>.
export function useWebsiteMenuService(names: MenuNameByCountry = MAIN_MENU_NAMES) {
  const name = useCountryValue()(names)

  const { result, loading } = getWebsiteMenu(name)

  const data = computed<WebsiteMenuType | null>(() =>
    result.value?.websiteMenu
      ? // menu_json is a GraphQL JSON scalar (typed `unknown`); the shape is our contract.
        mapMenu(result.value.websiteMenu.menu_json as WebsiteMenuType)
      : null
  )

  return { loading, data }
}
