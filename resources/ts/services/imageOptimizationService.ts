type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png'

/**
 * Image Optimization Service - Using Fastly IO for RWD image optimization
 *
 * NOTE the two different CDNs in this app. This one is GorillaDash's SHARED static
 * asset CDN (cdn.gorilladash.com, a Fastly service with Image Optimizer), which
 * serves everything under public/static/ for every client site. The edge in front of
 * this site's own HTML is Cloudflare (deploy/cloudflare/). They are unrelated:
 * changing the HTML edge does not touch anything below.
 *
 * Format selection is deterministic: every generated URL is identical on the
 * server and the client, and Fastly negotiates the best format per request via
 * the `auto=avif,webp` parameter + the browser's `Accept` header. We deliberately
 * do NOT detect browser support in JS — async detection (`new Image()`) isn't
 * settled at hydration time, so it produced different `format`/`auto` params on
 * the server vs the client and caused Vue hydration mismatches.
 */

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: ImageFormat
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  crop?: string
  blur?: number
  sharpen?: number
  brightness?: number
  contrast?: number
  saturation?: number
  hue?: number
  gamma?: number
  flip?: 'horizontal' | 'vertical'
  rotate?: number
  trim?: number
  metadata?: boolean
}

export interface ResponsiveImageSizes {
  mobile: number[]
  tablet: number[]
  desktop: number[]
}

/**
 * Default responsive image size configuration
 */
export const DEFAULT_RESPONSIVE_SIZES: ResponsiveImageSizes = {
  mobile: [320, 480, 640, 768],
  tablet: [768, 1024, 1200],
  desktop: [1200, 1440, 1600, 1920]
}

export const DEFAULT_BANNER_SIZES: ResponsiveImageSizes = {
  mobile: [320, 480, 640, 768],
  tablet: [768, 1024, 1200],
  desktop: [1200, 1440, 1600, 1920]
}

/**
 * The explicit Fastly `format` to request — the fallback format served to
 * clients that don't advertise avif/webp in their `Accept` header. Defaults to
 * `jpeg` (universally supported); modern browsers are transparently upgraded to
 * avif/webp by the `auto` parameter, so this only affects very old clients.
 *
 * Deterministic by design (no browser/runtime branching) so the SSR and client
 * renders emit identical URLs.
 *
 * @param {ImageFormat} [preferredFormat='jpeg'] - Fallback format to request
 * @returns {ImageFormat} The format to put in the Fastly `format` param
 */
export const getOptimizedFormat = (preferredFormat: ImageFormat = 'jpeg'): ImageFormat =>
  preferredFormat

/**
 * Generate Fastly IO optimization parameters for image transformation
 *
 * @param {ImageOptimizationOptions} [options={}] - Configuration options for image optimization
 * @returns {string} URL-encoded parameter string for Fastly IO
 *
 * @example
 * // Basic usage
 * generateFastlyIOParams()
 * // Output: "format=jpeg&auto=avif%2Cwebp"
 *
 * // With width and quality
 * generateFastlyIOParams({ width: 800, quality: 80 })
 * // Output: "width=800&quality=80&format=jpeg&auto=avif%2Cwebp"
 */
export const generateFastlyIOParams = (options: ImageOptimizationOptions = {}): string => {
  const params = new URLSearchParams()

  // Basic parameters
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.quality) params.append('quality', options.quality.toString())
  if (options.fit) params.append('fit', options.fit)

  // Fallback format (auto upgrades modern browsers to avif/webp below).
  params.append('format', getOptimizedFormat(options.format))

  // Crop and transform
  if (options.crop) params.append('crop', options.crop)
  if (options.blur) params.append('blur', options.blur.toString())
  if (options.sharpen) params.append('sharpen', options.sharpen.toString())

  // Color adjustments
  if (options.brightness) params.append('brightness', options.brightness.toString())
  if (options.contrast) params.append('contrast', options.contrast.toString())
  if (options.saturation) params.append('saturation', options.saturation.toString())
  if (options.hue) params.append('hue', options.hue.toString())
  if (options.gamma) params.append('gamma', options.gamma.toString())

  // Transformations
  if (options.flip) params.append('flip', options.flip)
  if (options.rotate) params.append('rotate', options.rotate.toString())
  if (options.trim) params.append('trim', options.trim.toString())

  // Metadata
  if (options.metadata !== undefined) {
    params.append('metadata', options.metadata ? '1' : '0')
  }

  // Let Fastly serve avif/webp based on the request's Accept header (content
  // negotiation at the edge), falling back to `format` for older clients.
  // Constant → identical URLs on server and client (no hydration mismatch).
  params.append('auto', 'avif,webp')

  return params.toString()
}

/**
 * Optimize single image URL
 *
 * @param {string} originalUrl - Original image URL
 * @param {ImageOptimizationOptions} [options={}] - Configuration options for image optimization
 * @returns {string} Optimized image URL
 *
 * @example
 * optimizeImageUrl('https://example.com/image.jpg', { width: 800, quality: 80 })
 * // Output: "https://example.com/image.jpg?width=800&quality=80&format=jpeg&auto=avif%2Cwebp"
 */
export const optimizeImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!originalUrl) return originalUrl

  const params = generateFastlyIOParams(options)
  const separator = originalUrl.includes('?') ? '&' : '?'

  return `${originalUrl}${separator}${params}`
}

/**
 * Generate responsive image srcset string for different viewport widths
 *
 * @param {string} originalUrl - Original image URL
 * @param {number[]} sizes - Array of image widths to generate srcset for
 * @param {Omit<ImageOptimizationOptions, 'width'>} [options={}] - Configuration options excluding width
 * @returns {string} Responsive srcset string
 */
export const generateResponsiveSrcset = (
  originalUrl: string,
  sizes: number[],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string => {
  if (!originalUrl || !sizes.length) return originalUrl

  return sizes
    .map((width) => {
      const optimizedUrl = optimizeImageUrl(originalUrl, { ...options, width })
      return `${optimizedUrl} ${width}w`
    })
    .join(', ')
}

/**
 * Generate complete responsive image configuration including src, srcset for different devices and sizes
 *
 * @param {string} originalUrl - Original image URL
 * @param {ResponsiveImageSizes} [responsiveSizes=DEFAULT_RESPONSIVE_SIZES] - Object containing arrays of widths for different devices
 * @param {Omit<ImageOptimizationOptions, 'width'>} [options={}] - Configuration options excluding width
 * @returns {Object} Object containing responsive image configuration
 */
export const generateResponsiveImage = (
  originalUrl: string,
  responsiveSizes: ResponsiveImageSizes = DEFAULT_RESPONSIVE_SIZES,
  options: Omit<ImageOptimizationOptions, 'width'> = {}
) => {
  return {
    src: optimizeImageUrl(originalUrl, options),
    srcset: generateResponsiveSrcset(originalUrl, responsiveSizes.desktop, options),
    srcsetMobile: generateResponsiveSrcset(originalUrl, responsiveSizes.mobile, options),
    srcsetTablet: generateResponsiveSrcset(originalUrl, responsiveSizes.tablet, options),
    sizes: {
      mobile: '(max-width: 767px) 100vw',
      tablet: '(min-width: 768px) and (max-width: 1023px) 100vw',
      desktop: '(min-width: 1024px) 100vw'
    }
  }
}

/**
 * Check if URL is a valid image URL
 *
 * @param {string} url - URL string to validate
 * @returns {boolean} Whether the URL is a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']
    const pathname = urlObj.pathname.toLowerCase()

    return (
      imageExtensions.some((ext) => pathname.endsWith(ext)) ||
      urlObj.searchParams.has('width') ||
      urlObj.searchParams.has('auto')
    )
  } catch {
    return false
  }
}

/**
 * Preload image by creating an Image object and waiting for it to load
 *
 * @param {string} url - URL of the image to preload
 * @returns {Promise<void>} Promise that resolves when image is loaded or rejects on error
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * Batch preload multiple images simultaneously
 *
 * @param {string[]} urls - Array of image URLs to preload
 * @returns {Promise<void[]>} Promise that resolves when all images are loaded or rejects if any fail
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(urls.map((url) => preloadImage(url)))
}
