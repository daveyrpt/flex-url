<?php

namespace App\Providers;

use Auth;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Rate limiter for shortening URLs
        RateLimiter::for('shorten', function (Request $request) {
            $user = $request->user();

            if (!$user) {
                // Fallback to IP-based limiting for unauthenticated requests
                return [
                    Limit::perMinute(2)->by($request->ip()),
                    Limit::perHour(5)->by($request->ip()),
                ];
            }

            // Different limits based on user type or subscription
            return [
                Limit::perMinute(10)->by($user->id), // 10 per minute
                Limit::perHour(100)->by($user->id), // 100 per hour
            ];
        });

        // General API rate limiter
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
