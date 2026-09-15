# API responses

Every JSON body a client site authors goes through
[`flugger/laravel-responder`](https://github.com/flugg/laravel-responder), so the
envelope is decided once instead of being retyped — slightly differently — in each
controller.

The starter ships no API route, so it does not ship the package either. This is the
recipe for the first one you add.

---

## 1. Installing it (it is not on Packagist for Laravel 13)

Upstream's last release is March 2025 and stops at `illuminate/contracts ^12.0`, so
`composer require flugger/laravel-responder` **fails outright** on a Laravel 13 app:

```
flugger/laravel-responder v3.5.0 requires illuminate/contracts ^5.1|…|^12.0
  -> your app is Laravel 13   ❌ Installation failed
```

Laravel Shift maintains the compatibility branches that become upstream's releases —
their l10, l11 and l12 PRs were all merged, and **l13 is open as
[flugg/laravel-responder#212](https://github.com/flugg/laravel-responder/pull/212)**.
Pin that branch:

```bash
composer config repositories.laravel-responder vcs https://github.com/laravel-shift/laravel-responder.git
composer require "flugger/laravel-responder:dev-l13-compatibility"
```

Three things worth knowing about that pin:

- **It is the first VCS package in the repo.** The lock records an `api.github.com`
  zipball, which is an _unauthenticated_ GitHub API call — it counts against the
  anonymous 60/hour limit. Composer falls back to a source clone when that fails, and
  `deploy/Dockerfile` already installs `git` and `unzip`, so the image build survives
  it. If CI starts flaking on it anyway, hand `setup-php` a
  `COMPOSER_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.
- **Check what the branch actually contains before trusting it.** At the time of
  writing the diff against l12 is Shift's usual output — docblock formatting,
  `?string $x = null` for the PHP 8.4 implicit-nullable deprecation, and one
  `UnauthorizedException` 403 → 401. Nothing else.
- **When #212 merges, undo the pin**: drop the `repositories` entry and move to a
  normal tagged constraint. Leave a note where your team will see it, or the VCS entry
  becomes cargo nobody dares touch.

⚠ `composer require` runs `boost:update`, which rewrites `CLAUDE.md`, `AGENTS.md` and
the mirrored skill files — including undoing this repo's `resources/ts/pages` fix.
Check `git status` after adding any package.

## 2. Publishing — and the langPath trap

```bash
php artisan vendor:publish --provider="Flugg\Responder\ResponderServiceProvider"
```

This writes `config/responder.php` and `resources/lang/en/errors.php`.

⚠ **Move that second file to `lang/en/errors.php` and delete `resources/lang/`.**
Laravel resolves `langPath()` to `resources/lang` _the moment that directory exists_,
and falls back to `lang/` otherwise. So publishing this one file silently redirects
where the **whole application** looks for every translation — including your own
`validation.php` overrides, which then stop being read. Verify after moving:

```bash
php artisan tinker --execute 'echo app()->langPath();'   # => …/lang
```

## 3. The envelope

```php
$this->success(['message' => __('Thank you — we will be in touch shortly.')])->respond();
// {"status": 200, "success": true, "data": {"message": "Thank you — …"}}

$this->error('enquiry_failed')->respond(503);
// {"status": 503, "success": false, "error": {"code": "enquiry_failed", "message": "Sorry, …"}}
```

Make it structural rather than a convention people have to remember — a base class all
API controllers extend:

```php
// app/Http/Controllers/Api/Controller.php
abstract class Controller extends BaseController
{
    use \Flugg\Responder\Http\MakesResponses;
}
```

**Error messages resolve from the CODE**, out of `lang/en/errors.php` — the controller
passes no message. That keeps the catalogue of every way the API can refuse a request
in one readable list, instead of as strings scattered through controllers:

```php
// lang/en/errors.php
'enquiry_failed' => 'Sorry, that could not be sent. Please try again in a moment.',
```

Add the code there _before_ using it; `error('typo_code')` renders the key.

## 4. ⚠ The envelope stops at bodies YOU author

This is the part that breaks something if you get it wrong.

The package ships a `ConvertsExceptions` trait that rewrites Laravel's exception
responses into the error envelope. **Do not wire it into `bootstrap/app.php`.**

A **422 must stay in Laravel's native shape**:

```json
{ "message": "…", "errors": { "email": ["…"] } }
```

because `laravel-precognition-vue` reads `errors.<field>` — that is what fills
`form.errors.email` and every inline message in the template
(`docs/public-forms.md` §3). Converted, it becomes:

```json
{ "error": { "code": "validation_failed", "fields": { "email": ["…"] } } }
```

…and every field error in the form renders **blank, with no console error and no failed
request**. The form still submits, still rejects bad input, still looks like it works —
it just stops telling the visitor what is wrong. That is an expensive bug to find.

429 from the throttle and 404/405 from the router stay native for the same reason:
they are answers the framework sends on its own, with a consumer contract already.

The line is **"a body this application decided to send"** (yours to shape) versus
**"a body the framework sent on its own"** (leave it).

## 5. The test that pins it

Status codes alone pass whether or not the endpoint goes through the responder at all —
so assert the body, and assert the boundary:

```php
it('leaves validation in Laravel native shape, NOT the envelope', function () {
    $body = $this->postJson('/api/enquiries', enquiry(['email' => 'not-an-email']))
        ->assertStatus(422)
        ->assertJsonValidationErrors('email')
        ->json();

    expect($body)->toHaveKeys(['message', 'errors'])
        ->and($body)->not->toHaveKey('error');
});
```

That third test is the one that earns its place: it fails the moment someone tidies up
the apparent inconsistency by putting validation through the responder too.
