/**
 * Behaviour suite for resources/ts/lib/demoWelcome.ts: the welcome panel opens once
 * per two-hour session.
 */
import assert from 'node:assert/strict'
import { WELCOME_SESSION_MS, parseShownAt, welcomeIsDue } from '../../resources/ts/lib/demoWelcome'

const now = Date.UTC(2026, 8, 16, 10, 0, 0)
const minute = 60 * 1000

assert.equal(WELCOME_SESSION_MS, 2 * 60 * minute)

// Never shown: open it.
assert.equal(welcomeIsDue(null, now), true)

// Shown within the session: stay closed, right up to the last millisecond.
assert.equal(welcomeIsDue(now - 5 * minute, now), false)
assert.equal(welcomeIsDue(now - (WELCOME_SESSION_MS - 1), now), false)

// Two hours or more since it was shown: a new session, open it again.
assert.equal(welcomeIsDue(now - WELCOME_SESSION_MS, now), true)
assert.equal(welcomeIsDue(now - 3 * 60 * minute, now), true)

// A timestamp in the future (clock changed) starts a new session.
assert.equal(welcomeIsDue(now + 10 * minute, now), true)

// Unreadable storage counts as never shown.
assert.equal(parseShownAt(null), null)
assert.equal(parseShownAt(''), null)
assert.equal(parseShownAt('not-a-number'), null)
assert.equal(parseShownAt(String(now)), now)
assert.equal(welcomeIsDue(parseShownAt('garbage'), now), true)

console.log('demoWelcome: all assertions passed')
