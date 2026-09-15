/**
 * Behavior suite for resources/ts/lib/dates.ts.
 *
 * The property that matters: a CMS date renders as the SAME day whatever timezone the
 * runtime is in, because SSR runs in the server's zone and hydration runs in the
 * viewer's. Node re-reads process.env.TZ per Date construction, so one process can
 * check every zone.
 *
 * Runs inside Pest via tests/Unit/FrontendCmsDateTest.php; standalone with:
 *
 *   node_modules/.bin/tsx tests/js/cmsDate.test.ts
 */
import assert from 'node:assert/strict'
import { formatCmsDate } from '../../resources/ts/lib/dates'

// UTC-11 through UTC+14 — every offset a server or a viewer can be in.
const ZONES = [
  'UTC',
  'Pacific/Kiritimati', // UTC+14, the day ahead
  'Pacific/Niue', // UTC-11, the day behind
  'Asia/Taipei',
  'America/Los_Angeles',
  'Australia/Sydney'
]

for (const zone of ZONES) {
  process.env.TZ = zone

  assert.equal(formatCmsDate('2026-07-29 00:00:00'), 'July 29, 2026', `midnight in ${zone}`)
  assert.equal(formatCmsDate('2026-07-29 23:59:59'), 'July 29, 2026', `end of day in ${zone}`)
  assert.equal(formatCmsDate('2026-01-01 00:00:00'), 'January 1, 2026', `new year in ${zone}`)
  assert.equal(formatCmsDate('2026-07-29'), 'July 29, 2026', `date-only in ${zone}`)
}

process.env.TZ = 'UTC'
assert.equal(formatCmsDate(null), '', 'null → empty')
assert.equal(formatCmsDate(undefined), '', 'undefined → empty')
assert.equal(formatCmsDate(''), '', 'empty string → empty')
assert.equal(formatCmsDate('not a date'), '', 'unparseable → empty')

console.log('cmsDate: all assertions passed')
