/**
 * Behavior suite for the frontend path layer (resources/ts/lib/pagePaths.ts):
 * cmsRoute() forward-building, matchCmsRoute() reverse-matching, the fallbacks,
 * and the per-locale CMS-rename semantics both must follow.
 *
 * Plain node:assert checks — this repo has no JS test runner, so the suite runs
 * inside Pest through the already-installed tsx binary (tests/Unit/
 * FrontendPagePathsTest.php shells out to it), making `composer test` and CI red
 * when the path logic regresses. Run standalone with:
 *
 *   node_modules/.bin/tsx tests/js/pagePaths.test.ts
 *
 * The import is relative on purpose, as is pagePaths.ts' own import of the
 * generated module — no vite/tsconfig alias resolution is needed under tsx.
 * The generated resources/ts/types/cmsRoutes.ts must exist (the Pest wrapper
 * regenerates it when missing).
 */
import assert from 'node:assert/strict'
import {
  cmsRoute,
  matchCmsRoute,
  pagePath,
  setCmsRoutes,
  setPagePaths
} from '../../resources/ts/lib/pagePaths'

// ---------------------------------------------------------------------------
// cmsRoute — forward: (name, params) → path
// ---------------------------------------------------------------------------

// No props yet (fresh boot, detached contexts): fallback templates + fallback
// paths must produce today's default URLs, byte-identical.
setPagePaths(undefined)
setCmsRoutes(undefined)
assert.equal(
  cmsRoute('locations.show', { slug: 'vestavia-hills-al' }, 'en'),
  '/locations/vestavia-hills-al'
)

// Props landed and the CMS renamed locations → stores (en) / almataajir (ar):
// every URL follows, per locale.
setPagePaths({
  en: { homepage: '/', locations: '/stores' },
  ar: { homepage: '/', locations: '/almataajir' }
})
setCmsRoutes({
  'locations.show': { uri: '/{page}/{slug}', page: 'locations' }
})
assert.equal(
  cmsRoute('locations.show', { slug: 'vestavia-hills-al' }, 'en'),
  '/stores/vestavia-hills-al'
)
assert.equal(
  cmsRoute('locations.show', { slug: 'vestavia-hills-al' }, 'ar'),
  '/almataajir/vestavia-hills-al'
)
assert.equal(pagePath('locations', 'en'), '/stores')

// A NEW sub-route + page key arriving purely via the shared props — zero
// frontend code (the generated types don't know it yet; runtime must).
setPagePaths({ en: { homepage: '/', catering: '/catering-menu' } })
setCmsRoutes({ 'catering.show': { uri: '/{page}/{item}', page: 'catering' } })
assert.equal(
  cmsRoute('catering.show' as never, { item: 'platters' } as never, 'en'),
  '/catering-menu/platters'
)

// Failure modes fail loudly instead of emitting a wrong URL.
assert.throws(() => cmsRoute('nope.show' as never, {} as never, 'en'), /not a CMS-driven route/)
assert.throws(
  () => cmsRoute('catering.show' as never, {} as never, 'en'),
  /needs a "item" parameter/
)

// ---------------------------------------------------------------------------
// matchCmsRoute — reverse: URL → { name, params }
// ---------------------------------------------------------------------------

// No props: fallback templates + fallback paths, monolingual behavior.
setPagePaths(undefined)
setCmsRoutes(undefined)
assert.deepEqual(matchCmsRoute('/', 'en'), { name: 'home', params: {} })
assert.deepEqual(matchCmsRoute('/locations/vestavia-hills-al', 'en'), {
  name: 'locations.show',
  params: { slug: 'vestavia-hills-al' }
})
assert.deepEqual(matchCmsRoute('/locations', 'en'), {
  name: 'page',
  params: { page: 'locations' }
})
assert.equal(matchCmsRoute('/csrf-cookie', 'en'), null)
assert.equal(matchCmsRoute('/catering/anything/deep/here', 'en'), null)

// After the rename: new slugs match, old slugs are null — same as the server's 404.
setPagePaths({
  en: { homepage: '/', locations: '/stores' },
  ar: { homepage: '/', locations: '/almataajir' }
})
setCmsRoutes({
  'locations.show': { uri: '/{page}/{slug}', page: 'locations' }
})
assert.deepEqual(matchCmsRoute('/stores/vestavia-hills-al', 'en'), {
  name: 'locations.show',
  params: { slug: 'vestavia-hills-al' }
})
assert.deepEqual(matchCmsRoute('/stores', 'en'), { name: 'page', params: { page: 'locations' } })
assert.equal(matchCmsRoute('/locations/vestavia-hills-al', 'en'), null)
assert.equal(matchCmsRoute('/locations', 'en'), null)

// A /{locale} prefix is detected and overrides `code` — the URL was built with
// that locale's slugs. Cross-locale mixes are null, same as the server.
assert.deepEqual(matchCmsRoute('/ar/almataajir/vestavia-hills-al', 'en'), {
  name: 'locations.show',
  params: { slug: 'vestavia-hills-al' }
})
assert.deepEqual(matchCmsRoute('/ar', 'en'), { name: 'home', params: {} })
assert.equal(matchCmsRoute('/ar/stores/x', 'en'), null)
assert.equal(matchCmsRoute('/en/almataajir/x', 'en'), null)

// Query/hash ignored; trailing slashes normalized.
assert.deepEqual(matchCmsRoute('/stores/x?utm=1#top', 'en'), {
  name: 'locations.show',
  params: { slug: 'x' }
})
assert.deepEqual(matchCmsRoute('/stores/', 'en'), { name: 'page', params: { page: 'locations' } })

// Not ours: absolute, mailto, hash-only.
assert.equal(matchCmsRoute('https://juniper-table-usa.example.com/stores', 'en'), null)
assert.equal(matchCmsRoute('mailto:hi@example.com', 'en'), null)
assert.equal(matchCmsRoute('#anchor', 'en'), null)

// Precedence mirrors registration order: a 2-segment URL under the locations page
// is locations.show even when the tail says "states" (server behaves identically).
assert.deepEqual(matchCmsRoute('/stores/states', 'en'), {
  name: 'locations.show',
  params: { slug: 'states' }
})

// Round-trips: match → forward build reproduces the URL.
const sub = matchCmsRoute('/stores/vestavia-hills-al', 'en')
assert.ok(sub !== null && sub.name === 'locations.show')
assert.equal(cmsRoute(sub.name, sub.params, 'en'), '/stores/vestavia-hills-al')
const top = matchCmsRoute('/stores', 'en')
assert.ok(top !== null && top.name === 'page')
assert.equal(pagePath(top.params.page as never, 'en'), '/stores')

// Monolingual deployment (one locale in the map): a locale-looking prefix is NOT
// stripped — /en/locations is a real 404 there, so it must not match (localizedUrl parity).
setPagePaths({ en: { homepage: '/', locations: '/locations' } })
assert.equal(matchCmsRoute('/en/locations', 'en'), null)

console.log('pagePaths behavior suite: all passed')
