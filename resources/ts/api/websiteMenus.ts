import { useLocale } from '@/composables/useLocale'
import { useQuery } from '@/composables/useQuery'
import { GetWebsiteMenuDocument } from './websiteMenus.generated'

// Source lives in ./websiteMenus.graphql. Import the generated
// const directly instead of the `graphql()` helper — see codegen.ts for why.
//
// ponytail: dropped the old tribe_slug variant + fallback — single-site USA build
// has no per-tribe menus. Re-add a $tribe_slug query if a multi-location site needs it.
//
// `locale` is the GD content language, taken from the request's locale so callers can't
// forget it. Header and footer nav labels come from this menu, so without it a translated
// site would render an English nav.
export function getWebsiteMenu(name: string) {
  const { locale } = useLocale()

  return useQuery(GetWebsiteMenuDocument, { name, locale: locale.value })
}
