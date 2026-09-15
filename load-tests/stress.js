import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE_URL || 'https://hungry-gorilla-usa.gorilladashstaging.com'

// Stress test: keep pushing the VU count up to find the breaking point
// (where RPS plateaus or p95 latency / error rate spikes).
export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    // Looser here on purpose — we WANT to see where it breaks.
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000']
  }
}

export default function () {
  const res = http.get(`${BASE}/`)
  check(res, { 'status is 200': (r) => r.status === 200 })
  sleep(Math.random() * 2 + 1)
}
