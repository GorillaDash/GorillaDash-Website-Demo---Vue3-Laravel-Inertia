<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A reCAPTCHA verification that Google answered, and refused.
 *
 * Carries the error codes, which is the whole reason this is an exception rather than
 * a `false`: "the captcha said no" is not actionable, and the difference between
 * `score-too-low`, `timeout-or-duplicate` and `hostname-mismatch` is what tells you
 * whether you are looking at a bot, a slow visitor, or a misconfigured key.
 *
 * A verification that could NOT be answered — Google unreachable, a bad response — is
 * not this: App\Services\Recaptcha lets those through rather than losing a real lead
 * to a third party's bad minute.
 */
class GoogleRecaptchaException extends RuntimeException
{
    /**
     * @param  list<string>  $errorCodes
     */
    public function __construct(public readonly array $errorCodes)
    {
        parent::__construct('Google reCAPTCHA refused the token: '.(
            $errorCodes === [] ? 'no error code given' : implode(', ', $errorCodes)
        ));
    }
}
