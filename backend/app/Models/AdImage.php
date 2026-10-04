<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdImage extends Model
{
    protected $fillable = ['ad_id', 'path', 'sort_order'];

    /** পাবলিক URL (বর্তমান রিকোয়েস্টের হোস্ট ধরে — dev proxy ও প্রোডাকশন দুই জায়গাতেই কাজ করে) */
    public function getUrlAttribute(): string
    {
        return asset('uploads/'.$this->path);
    }

    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class);
    }
}
