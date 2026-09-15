/**
 * Behavior suite for the SEO helpers (resources/ts/lib/seo.ts): absolute URLs,
 * hreflang alternates and JSON-LD serialisation.
 *
 * Plain node:assert checks, run inside Pest through tsx (tests/Unit/
 * FrontendSeoTest.php) — the same arrangement as pagePaths.test.ts. Standalone:
 *
 *   node_modules/.bin/tsx tests/js/seo.test.ts
 *
 * A client that adds schema.org builders of its own (see the note at the top of
 * lib/seo.ts) adds their checks here.
 */
import assert from 'node:assert/strict'
import {
  absoluteUrl,
  hreflangLinks,
  openGraphLocale,
  pathOnly,
  serializeJsonLd
} from '../../resources/ts/lib/seo'

// ---------------------------------------------------------------------------
// absoluteUrl / pathOnly
// ---------------------------------------------------------------------------

assert.equal(absoluteUrl('https://site.com', '/menu'), 'https://site.com/menu')
assert.equal(absoluteUrl('https://site.com/', '/menu'), 'https://site.com/menu')
assert.equal(absoluteUrl('https://site.com', '/'), 'https://site.com/')
assert.equal(absoluteUrl('https://site.com', 'menu'), 'https://site.com/menu')
// Already absolute (an editor's canonical on an article) passes through.
assert.equal(absoluteUrl('https://site.com', 'https://other.com/x'), 'https://other.com/x')
// No site URL known: the path, not "null/menu".
assert.equal(absoluteUrl(null, '/menu'), '/menu')
assert.equal(absoluteUrl('', '/menu'), '/menu')

assert.equal(pathOnly('/menu?x=1#top'), '/menu')
assert.equal(pathOnly('/menu#top'), '/menu')
assert.equal(pathOnly('/'), '/')
assert.equal(pathOnly('?x=1'), '/')

// ---------------------------------------------------------------------------
// hreflangLinks
// ---------------------------------------------------------------------------

const locales = [
  { value: 'en-US', code: 'en' },
  { value: 'ja-JP', code: 'jp' }
]
const urlForLocale = (code: string) => `/${code}/menu?x=1`

// Monolingual: nothing to alternate between.
assert.deepEqual(hreflangLinks('https://site.com', [locales[0]], urlForLocale), [])

// Multilingual: one per locale, absolute, query stripped, plus x-default = the first.
assert.deepEqual(hreflangLinks('https://site.com', locales, urlForLocale), [
  { hreflang: 'en-US', href: 'https://site.com/en/menu' },
  { hreflang: 'ja-JP', href: 'https://site.com/jp/menu' },
  { hreflang: 'x-default', href: 'https://site.com/en/menu' }
])

assert.equal(openGraphLocale('en-US'), 'en_US')
assert.equal(openGraphLocale('ar-EG'), 'ar_EG')

// ---------------------------------------------------------------------------
// serializeJsonLd — never lets CMS copy close the script tag
// ---------------------------------------------------------------------------

assert.equal(
  serializeJsonLd({ description: 'a </script><b>' }),
  '{"description":"a \\u003c/script>\\u003cb>"}'
)
assert.equal(serializeJsonLd([{ a: 1 }, { b: 2 }]), '[{"a":1},{"b":2}]')

console.log('seo.test.ts: all assertions passed')
