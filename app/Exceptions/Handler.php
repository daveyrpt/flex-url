<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;
                
                return response()->json([
                    'success' => false,
                    'message' => 'Rate limit exceeded. Too many requests.',
                    'error_type' => 'rate_limit_exceeded',
                    'retry_after' => $retryAfter,
                    'limits' => [
                        'anonymous_users' => [
                            'per_minute' => 2,
                            'per_hour' => 5,
                        ],
                        'registered_users' => [
                            'per_minute' => 10,
                            'per_hour' => 100,
                        ],
                    ],
                    'suggestion' => $request->user() 
                        ? 'Please wait before making another request.' 
                        : 'Create an account for higher rate limits.',
                ], 429);
            }
        });
    }
}
