<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Url;

class URLController extends Controller
{
    public function redirect($shortCode)
    {
        $url = Url::where('short_code', $shortCode)->first();
        
        if (!$url) {
            abort(404, 'Short URL not found');
        }
        
        // Check if URL has expired
        if ($url->expires_at && $url->expires_at->isPast()) {
            abort(410, 'Short URL has expired');
        }
        
        // Increment click count
        $url->incrementClicks();
        
        // Redirect to the original URL with 301 status
        return redirect($url->original_url, 301);
    }
}
