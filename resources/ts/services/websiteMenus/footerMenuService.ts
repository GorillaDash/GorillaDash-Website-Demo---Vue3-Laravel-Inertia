import { computed } from 'vue'
import {
  useWebsiteMenuService,
  type MenuNameByCountry
} from '@/services/websiteMenus/websiteMenuService'
import type { WebsiteMenuItemType } from '@/services/websiteMenus/transformer'
import type { FooterColumn, NavLink } from '@/constants/navigation'
import { SupportCountryName } from '@/stores/countryLimits'

// Footer menu name per market (USA fallback). Add entries as markets are enabled.
const FOOTER_MENU_NAMES: MenuNameByCountry = new Map([[SupportCountryName.USA, 'Footer Menu']])

// The "Footer Menu" tree groups its links under two top-level placeholders:
//   Top    → the footer link columns (chunked to match the 3-column grid)
//   Bottom → the legal links in the bottom bar
enum FooterGroup {
  Top = 'Top',
  Bottom = 'Bottom'
}

const FOOTER_COLUMN_SIZE = 4

const toNavLink = (item: WebsiteMenuItemType): NavLink => ({
  label: item.label,
  href: item.type === 'Internal Url' ? item.path || '#' : item.url || item.path || '#'
})

export function useFooterMenuService() {
  const { loading, data } = useWebsiteMenuService(FOOTER_MENU_NAMES)

  const group = (name: FooterGroup) => data.value?.children.find((child) => child.name === name)

  const footerColumns = computed<FooterColumn[]>(() => {
    const items = group(FooterGroup.Top)?.children ?? []
    const columns: FooterColumn[] = []
    for (let i = 0; i < items.length; i += FOOTER_COLUMN_SIZE) {
      columns.push({ links: items.slice(i, i + FOOTER_COLUMN_SIZE).map(toNavLink) })
    }
    return columns
  })

  const legalLinks = computed<NavLink[]>(() =>
    (group(FooterGroup.Bottom)?.children ?? []).map(toNavLink)
  )

  return { loading, footerColumns, legalLinks }
}
