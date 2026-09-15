#!/usr/bin/env node
/**
 * Canonicalise Tailwind classes with Tailwind's OWN `canonicalizeCandidates` — the routine
 * behind `@tailwindcss/upgrade` and the eslint-plugin-tailwind-canonical* plugins — loaded
 * against resources/css/app.css, so it knows this project's theme and tokens.
 *
 *   max-w-[87rem]      → max-w-348        spacing scale (0.25rem × n)
 *   border-b-[10px]    → border-b-10      bare px widths
 *   rounded-[1.5rem]   → rounded-3xl      named radii
 *   aspect-[544/437]   → aspect-544/437   bare ratios
 *   -ml-[6%]           → ml-[-6%]         negative arbitrary values
 *   !bg-white          → bg-white!        v4 important placement
 *
 * px values stay px (`w-[317px]`, `leading-[34px]`) unless you pass `--rem=16`, which lets
 * Tailwind fold pixels onto the rem scale (`leading-[34px]` → `leading-8.5`). Font sizes
 * (`text-[1.375rem]`), clamp(), percentages and grid templates never change — there is
 * nothing canonical for them to become.
 *
 * Usage: node bin/tailwind-scale.mjs [--fix | --check] [--rem=16] [files or dirs…]
 *   (no mode)  report what --fix would change
 *   --fix      rewrite in place — `pnpm run tw:scale`, inside `pnpm run lint`, lint-staged
 *   --check    exit 1 if anything would change — `pnpm run lint:check`, hence CI
 *   no paths   = resources/ts
 *
 * Only quoted strings are scanned (class="…", class-name="…", :class arrays, TS string
 * constants), so comments and prose are never rewritten. Tailwind's packages are reached
 * through @tailwindcss/vite's own dependency tree, so this adds no dependency.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { extname, join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const mode = args.includes('--fix') ? 'fix' : args.includes('--check') ? 'check' : 'report'
const rem = Number(args.find((a) => a.startsWith('--rem='))?.slice(6)) || undefined
const roots = args.filter((a) => !a.startsWith('--'))
if (roots.length === 0) roots.push('resources/ts')

const SKIP = [/\.generated\.ts$/, /\/graphql\/__generated__\//, /\/(routes|actions|wayfinder)\//]
const EXT = new Set(['.vue', '.ts', '.tsx'])

function* walk(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) yield* walk(join(path, entry))
  } else if (EXT.has(extname(path)) && !SKIP.some((re) => re.test(path))) {
    yield path
  }
}

// @tailwindcss/node is not a direct dependency; resolve it the way @tailwindcss/vite does.
const viteRequire = createRequire(createRequire(resolve('package.json')).resolve('@tailwindcss/vite'))
const { __unstable__loadDesignSystem } = await import(viteRequire.resolve('@tailwindcss/node'))
const design = await __unstable__loadDesignSystem(readFileSync('resources/css/app.css', 'utf8'), {
  base: resolve('resources/css')
})

// canonicalizeCandidates de-duplicates its output, so it is not index-aligned — ask per token.
const cache = new Map()
const canonical = (token) => {
  if (!cache.has(token)) {
    const [out] = design.canonicalizeCandidates([token], rem ? { rem } : undefined)
    cache.set(token, out || token)
  }
  return cache.get(token)
}

// Every quoted string (no newlines, no interpolation) — where classes live in .vue/.ts.
const stringRe = /"([^"\\\n]*)"|'([^'\\\n]*)'|`([^`\\$]*)`/g
// A token worth asking Tailwind about: starts like a utility (or an arbitrary property /
// variant, `[scrollbar-width:none]`, `[&>*]:…`), contains no quotes or spaces.
const tokenish = /^(?:[!-]?[a-z]|\[)[\w:[\]/.%()&>*+~,#!=-]*$/i

function transform(source) {
  const changes = []
  const out = source.replace(stringRe, (literal) => {
    const quote = literal[0]
    const inner = literal.slice(1, -1)
    if (!inner.trim()) return literal
    const rewritten = inner
      .split(/(\s+)/)
      .map((part) => {
        if (!tokenish.test(part)) return part
        const to = canonical(part)
        if (to !== part) changes.push([part, to])
        return to
      })
      .join('')
    return quote + rewritten + quote
  })
  return { out, changes }
}

let total = 0
for (const root of roots) {
  for (const file of walk(root)) {
    const source = readFileSync(file, 'utf8')
    const { out, changes } = transform(source)
    if (!changes.length) continue
    total += changes.length
    if (mode === 'fix') writeFileSync(file, out)
    const name = relative(process.cwd(), file)
    for (const [from, to] of changes) {
      console.log(`${mode === 'fix' ? 'fixed    ' : 'would fix'}  ${name}: ${from} → ${to}`)
    }
  }
}

if (mode === 'check' && total) {
  console.error(`\n${total} class(es) are not in Tailwind's canonical form — run \`pnpm run tw:scale\`.`)
  process.exit(1)
}
if (total) console.log(`\n${mode === 'fix' ? 'rewrote' : 'would rewrite'} ${total} class(es)`)
else console.log('every class is already canonical')
