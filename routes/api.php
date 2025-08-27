<?php

use App\Http\Controllers\API\V1\URLController;
use App\Http\Controllers\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// URL Shortener API Routes
Route::prefix('v1')->middleware('web')->group(function () {
    
    Route::middleware('throttle:shorten')->group(function () {
        Route::post('/shorten', [URLController::class, 'shorten']);
        Route::get('/urls', [URLController::class, 'index']);
        
    });
    Route::post('/upload', [URLController::class, 'uploadFile']);
    Route::get('/files/{encodedPath}', [URLController::class, 'serveFile']);
    
    // Other public routes (less restrictive)
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/redirect/{shortCode}', [URLController::class, 'redirect']);
        Route::get('/stats/{shortCode}', [URLController::class, 'stats']);
    });

    // Chat Bot API Routes
    Route::prefix('chat')->group(function () {
        Route::post('/send', [ChatController::class, 'send']);
    });
});
