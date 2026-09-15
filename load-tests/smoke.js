import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE_URL || 'https://acme-usa.gorilladashstaging.com'

// Smoke test: 1 VU for a short time, just to verify the site responds
// and the script is correct before running heavier load tests.
export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500']
  }
}

export default function () {
  const res = http.get(`${BASE}/`)
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body.length > 0
  })
  sleep(1)
}
