import assert from 'node:assert/strict'
import {
  openStatus,
  toTwentyFourHour,
  weekHours
} from '../../resources/ts/services/tribeHoursService'

const hours = {
  Monday: [{ open: '6:30 am', close: '4:00 pm' }],
  Tuesday: [{ open: '6:30 am', close: '4:00 pm' }],
  Wednesday: [{ open: '6:30 am', close: '4:00 pm' }],
  Thursday: [{ open: '6:30 am', close: '4:00 pm' }],
  Friday: [{ open: '6:30 am', close: '4:00 pm' }],
  Saturday: [{ open: '8:00 am', close: '1:00 pm' }],
  Sunday: [{ open: 'Closed', close: 'Closed' }]
}

assert.equal(toTwentyFourHour('6:30 am'), '06:30')
assert.equal(toTwentyFourHour('12:00 pm'), '12:00')
assert.equal(toTwentyFourHour('12:15 am'), '00:15')
assert.equal(toTwentyFourHour('4:00 pm'), '16:00')
assert.equal(toTwentyFourHour('19:30'), '19:30')

assert.equal(weekHours(hours)[0]!.label, '6:30am – 4pm')
assert.equal(weekHours(hours)[6]!.label, 'Closed')

// Monday 2026-09-14 at 10:00 in New York is 14:00 UTC.
assert.deepEqual(openStatus(hours, 'America/New_York', new Date('2026-09-14T14:00:00Z')), {
  isOpen: true,
  label: 'Open until 4pm'
})
// Monday 05:00 New York: opens later today.
assert.deepEqual(openStatus(hours, 'America/New_York', new Date('2026-09-14T09:00:00Z')), {
  isOpen: false,
  label: 'Opens at 6:30am'
})
// Saturday 15:00 New York: closed Sunday, so next opening is Monday.
assert.deepEqual(openStatus(hours, 'America/New_York', new Date('2026-09-19T19:00:00Z')), {
  isOpen: false,
  label: 'Opens 6:30am Monday'
})

console.log('tribeHours: ok')
