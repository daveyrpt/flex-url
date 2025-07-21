<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Url;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class URLController extends Controller
{
    /**
     * Shorten a URL
     */
    public function shorten(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'original_url' => 'required|url|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid URL provided',
                'errors' => $validator->errors()
            ], 422);
        }

        $originalUrl = $request->input('original_url');
        
        // Check if URL already exists for this user (if authenticated)
        $existingUrl = null;
        if (Auth::check()) {
            $existingUrl = Url::where('original_url', $originalUrl)
                            ->where('user_id', Auth::id())
                            ->first();
        } else {
            // For anonymous users, check if URL exists without user_id
            $existingUrl = Url::where('original_url', $originalUrl)
                            ->whereNull('user_id')
                            ->first();
        }

        // Create new shortened URL
        $url = new Url();
        $url->original_url = $originalUrl;
        $url->short_code = $url->generateShortCode();
        $url->user_id = Auth::id(); // Will be null for anonymous users
        $url->save();

        return response()->json([
            'success' => true,
            'message' => 'URL shortened successfully',
            'data' => [
                'original_url' => $url->original_url,
                'short_url' => $url->short_url,
                'short_code' => $url->short_code,
                'clicks' => $url->clicks,
                'created_at' => $url->created_at
            ]
        ], 201);
    }

    /**
     * Get URL statistics
     */
    public function stats($shortCode)
    {
        $url = Url::where('short_code', $shortCode)->first();

        if (!$url) {
            return response()->json([
                'success' => false,
                'message' => 'Short URL not found'
            ], 404);
        }

        // Check if user has permission to view stats
        if ($url->user_id && (!Auth::check() || Auth::id() !== $url->user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view statistics'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'original_url' => $url->original_url,
                'short_url' => $url->short_url,
                'short_code' => $url->short_code,
                'clicks' => $url->clicks,
                'created_at' => $url->created_at,
                'expires_at' => $url->expires_at
            ]
        ]);
    }

    /**
     * Get user's URLs (authenticated users only)
     */
    public function index()
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $urls = Url::where('user_id', Auth::id())
                   ->orderBy('created_at', 'desc')
                   ->get()
                   ->map(function ($url) {
                       return [
                           'id' => $url->id,
                           'original_url' => $url->original_url,
                           'short_url' => $url->short_url,
                           'short_code' => $url->short_code,
                           'clicks' => $url->clicks,
                           'created_at' => $url->created_at,
                           'expires_at' => $url->expires_at
                       ];
                   });

        return response()->json([
            'success' => true,
            'data' => $urls
        ]);
    }
}
