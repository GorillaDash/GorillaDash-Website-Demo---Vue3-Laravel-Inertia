import { computed } from 'vue'
import { getWebsiteSection } from '@/api/websiteContents'
import { getValueByName } from '@/services/websiteContentValue'

/** A named organisation-level website section, with a lookup for its content values. */
export function useSiteSection(name: string) {
  const { result, loading } = getWebsiteSection(name)

  const section = computed(() => result.value?.websiteSection ?? null)
  const value = (contentName: string): string => getValueByName(contentName, section.value) ?? ''

  return { section, value, loading }
}
