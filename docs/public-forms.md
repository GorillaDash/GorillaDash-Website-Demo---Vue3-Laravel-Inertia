# Public forms

The starter ships no form, because no two client sites want the same one. What it does
ship is the shape a form has to have here — and that shape is not the Laravel default,
for one reason: **these pages are edge-cached and served cookie-less**
(`docs/edge-html-cache.md`), so a form built the normal way quietly takes the edge cache
away from every visitor who touches it.

This is the whole recipe, in the order you'd build it. GrazeCraze's catering inquiry
form is the worked version if you want to read one.

---

## 1. The endpoint goes on the stateless `api` group

```php
// routes/api.php
Route::post('/enquiries', [EnquiryController::class, 'store'])
    ->middleware(['precognitive', 'throttle:enquiries'])
    ->name('enquiries.store');
```

Its controller extends `App\Http\Controllers\Api\Controller` and answers through
`flugger/laravel-responder` like every other API endpoint — install and envelope in
**`docs/api-responses.md`**, which also carries the one rule this page depends on
(§4: validation's 422 never goes through the envelope).

**Not `routes/web.php`.** A POST on the `web` group is CSRF-protected, and a visitor
arriving from the edge holds no `XSRF-TOKEN` — the page they were served had no session.
Priming one (`GET /csrf-cookie`) starts a session, and from that moment the edge sends
_every_ later request from that visitor straight to origin. The form would cost them the
cache for the rest of their visit.

The `api` group has no session and no CSRF to begin with, so there is nothing to prime.

**Is dropping CSRF safe here?** On an unauthenticated public form, yes, and it is worth
being precise about why rather than treating it as a shortcut. A CSRF token protects a
**logged-in victim** from an action another site forged on their behalf. These sites have
no logged-in users at all, and the action is "create a lead" — which an attacker can POST
directly, with or without a victim. The token buys nothing and costs the cache.

If your site ever grows real authentication, this reasoning expires with it.

Two things follow:

- Add the group's first segment (`api`) to `$reserved` in `routes/web.php`, or the CMS
  could put a page at that path.
- Address it from the frontend with **Wayfinder** (`@/routes/...`), not `pagePath()` —
  it is a static route, not a CMS one (see the `gd-locale-links` skill).

## 2. What stands in for CSRF

|                                       | Where                                                    |
| ------------------------------------- | -------------------------------------------------------- |
| reCAPTCHA v3 — see below              | `App\Services\Recaptcha` + `composables/useRecaptcha.ts` |
| Per-IP throttle, keyed on **intent**  | `RateLimiter::for(...)` in `AppServiceProvider`          |
| A `prohibited` honeypot field         | the `FormRequest` + the component                        |
| Server-side validation of every field | the `FormRequest`                                        |

⚠ **The throttle needs two separate `by` KEYS, not just two maxima.** A precognitive form
revalidates on every field change, so filling in seven fields sends seven requests to the
same route. The rate-limit counter is keyed on the `by` value, so a shared key lets the
typing spend the submit budget — a browser run will 429 itself before Submit is ever
pressed.

```php
RateLimiter::for('enquiries', fn (Request $request): Limit => $request->isAttemptingPrecognition()
    ? Limit::perMinute(60)->by('enquiry-validate:'.$request->ip())
    : Limit::perMinute(5)->by('enquiry-submit:'.$request->ip()));
```

The honeypot must be **off-screen, not `hidden`**, with `tabindex="-1"` and
`autocomplete="off"` — a bot that fills every field should still trip it, and no real
visitor or password manager should ever reach it.

## 3. Validate with Precognition, so there is one rule set

`laravel-precognition-vue` (it needs `axios` as a peer). The form validates each field
against the **same `FormRequest`** the real submit runs, so the messages a visitor sees
are the server's and there is no second rule set on the frontend to drift from them.

```ts
const form = useForm('post', store.url(), {
  /* fields */
})
// …then on each field:  @change="form.validate('email')"
```

⚠ **`shouldRenderJsonWhen` in `bootstrap/app.php` must still match `api/*`.** If it is
ever narrowed, a failed validation answers `302 back` instead of the `422` the
precognition client understands, and the form silently stops showing errors.

⚠ **And that 422 must keep Laravel's own `{"message", "errors"}` shape.** The controller's
own bodies go through `flugger/laravel-responder` (`docs/api-responses.md`), but the
envelope stops there: the package's `ConvertsExceptions` would turn validation into
`{"error": {"code": "validation_failed", "fields": …}}`, and `form.errors.*` reads
`errors.<field>` — so every inline message in the template would render blank while the
form still submitted, still rejected bad input, and still looked like it worked.

## 4. reCAPTCHA v3

Use the house client — `composer require google/recaptcha` and
`ReCaptcha\ReCaptcha`, the same as TBA's and Exit-Factor's `RecaptchaService`. It
gives you the three checks in one fluent call, and a client site's leads should look
identical wherever in the estate they were filed from:

```php
$response = (new ReCaptcha($secret, $this->transport))
    ->setExpectedHostname(parse_url(config('app.url'), PHP_URL_HOST))
    ->setExpectedAction($action)
    ->setScoreThreshold((float) config('services.recaptcha.score_threshold', 0.5))
    ->verify($token, $ip);
```

**Three checks, not one.** Each closes a different hole:

|              |                                                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **score**    | is this traffic bot-shaped?                                                                                                                                                                    |
| **action**   | a v3 token carries the action it was minted for, so one from another form on another page is not replayable here                                                                               |
| **hostname** | the response says which host minted it. Google's console already restricts a key by domain — but that can be switched off, and this is the half that doesn't depend on someone else's checkbox |

Keep the house names too: the token travels in **`g_recaptcha_token`**, and a refusal
**throws with Google's error codes** rather than returning `false`. That second one
earns its keep the first time a customer says their enquiry bounced —
`score-threshold-not-met` and `hostname-mismatch` need completely different answers,
and `false` tells you neither.

### The four properties to preserve

1. **Unconfigured means off, on both sides.** No site key → no script, no token. No
   secret → nothing verified. Every local checkout and any country whose keys are not
   issued submits exactly as before. The halves fail open together; neither can be
   enabled alone, which is what stops a half-configured deploy from breaking the form.
2. **Unreachable means allow.** A connection failure or an unparseable reply is "we
   could not ask", not "the answer is no" — let the lead through and log it. Losing
   real leads because a third party had a bad minute is the more expensive failure.
   (The reference sites treat these as a refusal; this is a deliberate divergence.)
3. **Load the script on first interaction with the form, not on page load.** It is
   ~80KB of third-party JS on an edge-cached marketing page whose LCP matters
   (`docs/perf-mobile-pagespeed.md`), and most visitors never touch the form.
4. **Verify once, on the real submit only.** A v3 token is short-lived and single-use,
   and a precognitive form revalidates constantly — so the check cannot be a rule on
   the field:

   ```php
   public function withValidator(Validator $validator): void
   {
       if ($this->isPrecognitive()) {
           return;   // never spend the token while the visitor is still typing
       }
       $validator->after(/* verify; catch the exception, log the codes, add an error */);
   }
   ```

### Gate it on the secret, not on `app.env`

The reference sites short-circuit everything outside production. Prefer "no secret
configured" as the off switch: it covers local and testing the same way, but it also
means a staging host with keys really does verify — instead of staging being the one
environment where the captcha is never exercised before it meets real traffic.

### Three traps

⚠ **`Http::fake()` cannot intercept it.** The package uses its OWN transport (curl or
a raw socket), not Laravel's HTTP client, so a test written that way calls Google for
real. Take an injectable `?RequestMethod $transport = null` in the constructor and bind
a stub in tests — then you can also assert the transport was never reached at all on a
precognitive request.

⚠ **Hiding Google's badge obliges you to show their disclosure text** ("This site is
protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply"). That
is their terms, not a preference. Hide it only if the bottom-right corner is spoken for
— and if you remove the disclosure, put the badge back.

⚠ **Headless browsers cannot pass it.** Google answers `browser-error`, so an automated
check against a captcha-configured environment always sees the failure path. Leave the
keys blank locally, and pin them blank in `phpunit.xml` — otherwise the suite picks up
whatever is in the developer's `.env`.

⚠ **`composer require` runs `boost:update`**, which rewrites `CLAUDE.md`, `AGENTS.md`
and the mirrored skill files — including undoing this repo's `resources/ts/pages` fix.
Check `git status` after adding any package.

## 5. The test that matters

Everything above exists to protect one property, so assert it directly:

```php
it('hands back no session cookie, so the visitor keeps the edge cache', function () {
    $response = $this->postJson('/api/enquiries', $valid)->assertOk();

    $names = collect($response->headers->getCookies())->map->getName();

    expect($names)->not->toContain(config('session.cookie'))
        ->and($names)->not->toContain('XSRF-TOKEN');
});
```

That is the test that fails the day someone moves the route back onto `web`, or adds a
session middleware to the `api` group. Without it the regression is invisible: the form
keeps working, and the cache hit rate just quietly falls.
