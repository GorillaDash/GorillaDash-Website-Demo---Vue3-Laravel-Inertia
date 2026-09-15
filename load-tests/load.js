import http from 'k6/http'
import { check, sleep, group } from 'k6'

const BASE = __ENV.BASE_URL || 'https://juniper-table-usa.gorilladashstaging.com'

// Load test: ramp up to a steady number of users to see how the app server
// + DB behave under sustained, realistic traffic.
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 VUs
    { duration: '1m', target: 20 }, // hold at 20 VUs
    { duration: '30s', target: 0 } // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% errors
    http_req_duration: ['p(95)<800', 'p(99)<1500']
  }
}

export default function () {
  group('full page load', () => {
    const res = http.get(`${BASE}/`)
    check(res, { 'home 200': (r) => r.status === 200 })
  })

  sleep(Math.random() * 3 + 1) // think time 1-4s
}

// NOTE on Inertia navigation testing:
// A real client-side Inertia visit sends `X-Inertia: true` AND a matching
// `X-Inertia-Version` header. Without the correct version, Inertia replies
// 409 + X-Inertia-Location to force a full reload (expected behaviour, not an
// error). To load-test Inertia visits properly you must first GET the page,
// scrape the version out of the root div's `data-page` JSON, then send it on
// subsequent XHR requests. Skipped here because the app currently has only the
// `/` route, so an Inertia visit hits the same controller as the full load.
