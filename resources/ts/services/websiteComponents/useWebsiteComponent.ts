import { computed } from 'vue'
import { getWebsiteComponents, type ComponentInfoResult } from '@/api/websiteComponents'

/**
 * Base for website-component services: fetch a component TYPE by name, flatten its
 * active components, and map each into a view model.
 *
 * This is the shape for any REPEATABLE CMS list — callout cards, tiles, values,
 * timeline entries. It is not for a page's own fields: those are website *contents*,
 * read with getValueByName() off the page (see services/websiteContentValue.ts).
 *
 * Call inside <script setup>; Apollo is resolved app-wide. Wrap it in a named service
 * under this folder rather than calling it from a component, so the mapping to a typed
 * view model lives in one place per component type.
 */
export function useWebsiteComponent<T>(
  componentName: string,
  map: (item: ComponentInfoResult) => T,
  status = 'Active'
) {
  const { result, loading } = getWebsiteComponents([componentName], status)

  const items = computed<T[]>(() =>
    (result.value?.websiteComponents ?? [])
      .flatMap((type) => type?.components ?? [])
      .filter((component): component is ComponentInfoResult => component?.status === 'Active')
      .map(map)
  )

  return { items, loading }
}
