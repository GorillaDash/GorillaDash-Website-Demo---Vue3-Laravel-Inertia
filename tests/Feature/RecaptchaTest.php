<?php

use App\Exceptions\GoogleRecaptchaException;
use App\Services\Recaptcha;
use ReCaptcha\RequestMethod;
use ReCaptcha\RequestParameters;

/*
 * App\Services\Recaptcha — the server half of reCAPTCHA v3.
 *
 * No form posts through it yet (a fresh client site has none), so these exercise the service
 * directly. What they pin is the behaviour that is easy to get wrong later, when a
 * form does arrive and the temptation is to "simplify" this into one success check:
 *
 *  - it fails OPEN in two directions, because both failures cost real leads and
 *    neither costs much spam — not configured verifies nothing, and configured but
 *    unreachable lets the submission through;
 *  - it refuses on three grounds, not one — score, action AND hostname.
 */

/**
 * Google's answer, without Google. The package talks over its own transport rather
 * than Laravel's HTTP client, so `Http::fake()` cannot reach it — binding the
 * transport is what keeps the suite off the network.
 *
 * @param  array<string, mixed>|string  $answer
 */
function fakeGoogleSays(array|string $answer): void
{
    app()->instance(RequestMethod::class, new class ($answer) implements RequestMethod {
        public function __construct(private readonly array|string $answer)
        {
        }

        public function submit(RequestParameters $params): string
        {
            return is_string($this->answer) ? $this->answer : (string) json_encode($this->answer);
        }
    });
}

/** A transport that records whether it was asked at all, and always refuses. */
function refuseAndRecord(bool &$asked): void
{
    app()->instance(RequestMethod::class, new class ($asked) implements RequestMethod {
        public function __construct(private bool &$asked)
        {
        }

        public function submit(RequestParameters $params): string
        {
            $this->asked = true;

            return (string) json_encode(['success' => false]);
        }
    });
}

describe('with keys configured', function () {
    beforeEach(function () {
        config()->set('services.recaptcha.secret', 'test-secret');
        config()->set('services.recaptcha.score_threshold', 0.5);
        // The client checks the response's hostname against app.url's host.
        config()->set('app.url', 'http://localhost');
    });

    it('accepts a token Google scores above the threshold', function () {
        fakeGoogleSays([
            'success' => true,
            'hostname' => 'localhost',
            'action' => 'enquiry',
            'score' => 0.9,
        ]);

        app(Recaptcha::class)->verify('enquiry', 'tok', '127.0.0.1');
    })->throwsNoExceptions();

    it('refuses a low score, a failed check, a missing token and a token minted elsewhere', function (array $body, ?string $token) {
        fakeGoogleSays($body);

        expect(fn () => app(Recaptcha::class)->verify('enquiry', $token, '127.0.0.1'))
            ->toThrow(GoogleRecaptchaException::class);
    })->with([
        'low score' => [['success' => true, 'hostname' => 'localhost', 'action' => 'enquiry', 'score' => 0.1], 'tok'],
        'not successful' => [['success' => false, 'error-codes' => ['invalid-input-response']], 'tok'],
        // A token minted for another action on another page must not be replayable here.
        'another action' => [['success' => true, 'hostname' => 'localhost', 'action' => 'newsletter', 'score' => 0.9], 'tok'],
        // The response says which host minted it; Google's own domain restriction can
        // be switched off, so this is the half that doesn't depend on that checkbox.
        'another hostname' => [['success' => true, 'hostname' => 'evil.example', 'action' => 'enquiry', 'score' => 0.9], 'tok'],
        'no token at all' => [['success' => true, 'hostname' => 'localhost', 'action' => 'enquiry', 'score' => 0.9], null],
    ]);

    /*
     * The codes are the actionable part — score-too-low reads very differently from
     * hostname-mismatch when a real lead complains, which is why the refusal is an
     * exception carrying them rather than a false.
     */
    it('carries the error codes Google gave on the refusal', function () {
        fakeGoogleSays(['success' => false, 'error-codes' => ['timeout-or-duplicate']]);

        expect(fn () => app(Recaptcha::class)->verify('enquiry', 'tok', '127.0.0.1'))
            ->toThrow(function (GoogleRecaptchaException $e) {
                expect($e->errorCodes)->toContain('timeout-or-duplicate');
            });
    });

    /*
     * A response the client cannot parse is "we could not ask", not "the answer is
     * no" — the reference site treats these as a refusal; here a real lead wins.
     */
    it('lets the submission through when Google cannot be reached', function () {
        fakeGoogleSays('not json at all');

        app(Recaptcha::class)->verify('enquiry', 'tok', '127.0.0.1');
    })->throwsNoExceptions();
});

/*
 * The off switch is the SECRET, not app.env — so a staging host with keys really does
 * verify, instead of being the one environment where the captcha never runs before it
 * meets real traffic. phpunit.xml blanks both keys, which is this state.
 */
describe('with no secret configured', function () {
    it('verifies nothing, and never calls Google', function () {
        $asked = false;
        refuseAndRecord($asked);

        expect(app(Recaptcha::class)->enabled())->toBeFalse();

        app(Recaptcha::class)->verify('enquiry', 'tok', '127.0.0.1');

        expect($asked)->toBeFalse();
    });
});
