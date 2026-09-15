// Shared GCS static-asset paths. Files live in the bucket under
// static/clients/acme_/ and are served via the CDN below.
// Sync local public/static/ → bucket with `pnpm run static:upload`.
//
// The CDN host is the same for every country (the bucket path is per-client,
// not per-country), so it's a build-time constant: Vite inlines
// VITE_GCS_STATIC_URL from .env / .env.example at build (see deploy/Dockerfile).
// This must stay build-time — module-scope reads of the runtime config break
// under SSR (gcs.ts evaluates before the runtime config is populated).
export const STATIC_SOURCES_URL =
  import.meta.env.VITE_GCS_STATIC_URL ?? 'https://cdn.gorilladash.com/static/clients/acme_'

export function mergePath(...paths: string[]): string {
  return paths.join('/')
}

export const imageRootPath = mergePath(STATIC_SOURCES_URL, 'images')
export const iconPath = mergePath(imageRootPath, 'icon')
export const logoPath = mergePath(imageRootPath, 'logo')
export const bgPath = mergePath(imageRootPath, 'bg')
export const menuPath = mergePath(imageRootPath, 'menu')
