<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Url extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_url',
        'short_code',
        'user_id',
        'clicks',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'clicks' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function generateShortCode()
    {
        do {
            $shortCode = Str::random(8);
        } while (self::where('short_code', $shortCode)->exists());

        return $shortCode;
    }

    public function getShortUrlAttribute()
    {
        return config('app.url') . '/' . $this->short_code;
    }

    public function incrementClicks()
    {
        $this->increment('clicks');
    }
}