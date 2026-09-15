<?php

namespace App\Services;

use App\Exceptions\GoogleRecaptchaException;
use Illuminate\Support\Arr;
// Aliased: PHP class names are case-insensitive, so an unaliased `ReCaptcha` import
// collides with this file's own `Recaptcha` class.
use ReCaptcha\ReCaptcha as GoogleReCaptcha;
use ReCaptcha\RequestMethod;
use ReCaptcha\Response as GoogleResponse;

/**
 * reCAPTCHA v3 verification, on the house pattern (TBA's RecaptchaService is the
 * reference — same `google/recaptcha` client, same expected-hostname + expected-action
 * + score checks, same "throw with the error codes" contract; TheGreatGreek and Graze
 * Craze carry the same file).
 *
 * NOTHING CALLS THIS YET. A fresh client site has no public form; the machinery ships
 * here so the first one that lands is a `verify()` call and a token field, not a week
 * of plumbing — and so its keys can be issued and deployed ahead of the form. It is
 * inert until then, and inert on any deployment without a secret.
 *
 * v3 returns a SCORE rather than a pass/fail, so this is a judgement: the threshold is
 * Google's default (0.5) and configurable, because what counts as a bot differs by
 * traffic mix.
 *
 * Three checks, not one. Each closes a different hole:
 *
 *  - **score** — is this traffic bot-shaped?
 *  - **action** — v3 tokens carry the action they were minted for, so a token from
 *    some other form on some other page must not be replayable here. The caller names
 *    its own action and must pass the SAME string the browser minted with;
 *  - **hostname** — the response says which host minted it. Google's console already
 *    restricts a key by domain, but that restriction can be switched off, and this is
 *    the half that does not depend on someone else's checkbox.
 *
 * Two divergences from the reference, both deliberate:
 *
 *  - **It is gated on the SECRET, not on `app.env`.** TBA short-circuits everything
 *    outside production. Here, "no secret configured" is the off switch — which covers
 *    local and testing the same way, but also means a staging host with keys really
 *    does verify, instead of being the one environment where the captcha is never
 *    exercised before it meets real traffic.
 *  - **An unreachable Google ALLOWS.** The reference treats a connection failure like
 *    a refusal. Losing real leads because a third party had a bad minute is the more
 *    expensive failure; spam is the cheaper one. Only an answered refusal throws.
 *
 * ⚠ Whoever adds the first form: a v3 token is short-lived and SINGLE-USE, so verify
 * once on the real submit — never on a precognitive/live-validation request, which
 * fires on every keystroke and would spend the token before Submit.
 */
class Recaptcha
{
    /**
     * The package talks to Google over its OWN transport (curl or a raw socket), not
     * Laravel's HTTP client — so `Http::fake()` cannot intercept it and a test would
     * call Google for real. Injecting the transport is what makes this testable; left
     * null, the package picks its own default.
     */
    public function __construct(private readonly ?RequestMethod $transport = null)
    {
    }

    /**
     * The form field the token travels in — the house name, shared with TBA, Graze
     * Craze, TheGreatGreek and Exit-Factor so a lead looks the same wherever it was
     * filed from.
     */
    public const FORM_TOKEN = 'g_recaptcha_token';

    /**
     * Error codes that mean "we could not ask", not "the answer is no".
     *
     * @var list<string>
     */
    private const UNREACHABLE = [
        GoogleReCaptcha::E_CONNECTION_FAILED,
        GoogleReCaptcha::E_BAD_RESPONSE,
        GoogleReCaptcha::E_INVALID_JSON,
        GoogleReCaptcha::E_UNKNOWN_ERROR,
    ];

    /** Whether this deployment has a secret to verify against at all. */
    public function enabled(): bool
    {
        return filled(config('services.recaptcha.secret'));
    }

    /**
     * Verify a token for `$action`, or do nothing when the captcha is not configured.
     *
     * @throws GoogleRecaptchaException when Google answers and refuses
     */
    public function verify(string $action, ?string $token = null, ?string $ip = null): void
    {
        if (! $this->enabled()) {
            return;
        }

        $response = $this->client()
            ->setExpectedHostname($this->hostname())
            ->setExpectedAction($action)
            ->setScoreThreshold((float) config('services.recaptcha.score_threshold', 0.5))
            ->verify(
                $token ?? request()->input(self::FORM_TOKEN),
                $ip ?? request()->ip(),
            );

        if ($response->isSuccess() || $this->wasUnreachable($response)) {
            return;
        }

        throw new GoogleRecaptchaException($response->getErrorCodes());
    }

    /**
     * A verification Google never actually answered — it timed out, or replied with
     * something unparseable. The caller must not punish the visitor for that.
     */
    private function wasUnreachable(GoogleResponse $response): bool
    {
        return array_intersect($response->getErrorCodes(), self::UNREACHABLE) !== [];
    }

    private function client(): GoogleReCaptcha
    {
        return new GoogleReCaptcha((string) config('services.recaptcha.secret'), $this->transport);
    }

    /** The host tokens are expected to have been minted on. */
    private function hostname(): string
    {
        return (string) Arr::get(parse_url((string) config('app.url')), 'host');
    }
}
