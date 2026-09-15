<?php

namespace App\Providers;

use App\Enums\Locale;
use App\Services\CountryEnv;
use App\Services\WebsitePages;
use Carbon\CarbonImmutable;
use GorillaDash\WebsiteSdk\Connection;
use GorillaDash\WebsiteSdk\TokenManager;
use Illuminate\Contracts\Cache\Factory as CacheFactory;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // One page map per request. WebsitePages is asked for the same list three
        // times on a typical request (EnsureWebsitePage, the controller, and the
        // `pages` shared prop) and memoizes it per instance, so a shared instance
        // turns three cache round trips into one. Scoped, not singleton: Octane
        // flushes scoped instances between requests, so a CMS slug rename lands on
        // the next request instead of living in a worker until it restarts.
        $this->app->scoped(WebsitePages::class);

        // Local-dev only: composes .env for one country (`php artisan env:use`).
        // Bound rather than autowired because the repository root is a constructor
        // argument, which is also what lets a test point it at a temp directory
        // instead of clobbering the developer's real .env.
        $this->app->bind(CountryEnv::class, fn (): CountryEnv => new CountryEnv(base_path()));

        // The website SDK constructs TokenManager internally (inside WebsiteClient)
        // and never binds it, so expose it here. Using the same connection + cache
        // store as the SDK means the bearer token cache is shared with GraphQL calls.
        $this->app->bind(TokenManager::class, function ($app): TokenManager {
            $connection = Connection::fromConfig($app['config']->get('website-sdk'));

            return new TokenManager(
                $connection,
                $app->make(CacheFactory::class)->store($connection->cacheStore),
                $app->make(HttpFactory::class),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->assertLocalesAreValid();
        $this->configureDefaults();
    }

    /**
     * Fail the boot on a bad `APP_LOCALES`.
     *
     * A misspelled tag would otherwise silently drop a language: the routes would
     * lose their prefix, the switcher would vanish, and the site would quietly serve
     * English. A country's config.env is edited by hand, so this must be loud.
     */
    protected function assertLocalesAreValid(): void
    {
        $supported = config('i18n.supported');

        if ($supported === []) {
            throw new InvalidArgumentException('APP_LOCALES must list at least one locale.');
        }

        $locales = array_map(
            fn (string $tag): Locale => Locale::tryFrom($tag) ?? throw new InvalidArgumentException(
                "Unknown locale [{$tag}] in APP_LOCALES. Add it to App\\Enums\\Locale first."
            ),
            $supported,
        );

        $codes = array_map(fn (Locale $locale): string => $locale->code(), $locales);

        if (count($codes) !== count(array_unique($codes))) {
            throw new InvalidArgumentException(
                'APP_LOCALES lists locales that share a URL segment: '.implode(', ', $supported).'.'
            );
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        // Behind Cloudflare (TLS terminated at the CDN) reaching this origin over
        // HTTP, the GKE/GCE load balancer resets X-Forwarded-Proto to "http",
        // so trustProxies alone can't recover the real scheme. Force https for
        // URL generation to keep asset()/route()/Vite links off http:// (which
        // the browser would block as mixed content).
        if (config('app.force_https')) {
            URL::forceScheme('https');
        }

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
