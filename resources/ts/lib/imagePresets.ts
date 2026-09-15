import type {
  ImageOptimizationOptions,
  ResponsiveImageSizes
} from '@services/imageOptimizationService'

/**
 * Shared srcset width ladders + quality presets for FastlyOptimizedImage,
 * grouped by how large the image actually renders. Tune here, not per-usage.
 *
 * Note: the component's `sizes` is fixed at 100vw, so these ladders mainly
 * cap how large a candidate the browser may fetch (e.g. a card never pulls a
 * 1920px file). Widths include high-DPI headroom (~2–3× the CSS size).
 *
 * Only `bannerSizes` + `photoOptions` have a consumer in the starter today; the
 * rest are the roles a client site typically grows into. Add a preset per role,
 * not per component — two components rendering at the same size share one.
 */
type ImageOptions = Omit<ImageOptimizationOptions, 'width'>

/** Full-bleed backdrops / banners rendered at ~100vw. */
export const bannerSizes: ResponsiveImageSizes = {
  mobile: [640, 828, 1080, 1280],
  tablet: [1024, 1280, 1536],
  desktop: [1280, 1600, 1920]
}

/** ~43% side panels: full-bleed on mobile, ~half on desktop. */
export const panelSizes: ResponsiveImageSizes = {
  mobile: [480, 640, 828, 1080],
  tablet: [640, 828, 1024],
  desktop: [640, 768, 960, 1280]
}

/** Square cards in a 2–3 column grid. */
export const cardSizes: ResponsiveImageSizes = {
  mobile: [320, 480, 640, 768],
  tablet: [384, 512, 640],
  desktop: [384, 512, 640, 768]
}

/** Standard content photos. */
export const photoOptions: ImageOptions = { quality: 75 }

/**
 * Above-the-fold hero photos. Was 80 ("a touch crisper"), but at AVIF/WebP the
 * 75-vs-80 difference is invisible on photos while the LCP image cost
 * 105KiB→84KiB (measured) — kept separate from photoOptions so heroes can be
 * re-tuned independently.
 */
export const heroOptions: ImageOptions = { quality: 75 }

/** Faint decorative textures (opacity ~0.3) — can be heavily compressed. */
export const textureOptions: ImageOptions = { quality: 45 }

/**
 * `sizes` attribute strings describing how wide each image actually renders,
 * so the browser picks the right srcset candidate instead of assuming 100vw.
 * Full-bleed banners/textures need no entry — 100vw is the component default.
 *
 * One trap worth knowing before you add another: for a `w-auto` image the
 * browser uses `sizes` as the pre-load intrinsic width, and it BEATS the CSS
 * aspect-ratio — leaving the default 100vw there makes the box too wide until
 * the file arrives, which is a layout shift. Always give `w-auto` images a
 * `sizes` that tracks their real rendered width.
 */

/** 2-col @640px, 3-col @1024px grid inside a container. */
export const cardSizesAttr = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'

/** ~43% side panel on desktop, full-bleed below. */
export const panelSizesAttr = '(min-width: 1024px) 43vw, 100vw'
