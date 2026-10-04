<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ad extends Model
{
    protected $fillable = [
        'user_id', 'category_id', 'division_id', 'district_id', 'area',
        'title', 'description', 'price', 'negotiable', 'condition',
        'status', 'rejection_reason', 'is_featured', 'views',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'negotiable' => 'boolean',
            'is_featured' => 'boolean',
            'views' => 'integer',
        ];
    }

    /** শুধু লাইভ (অনুমোদিত) বিজ্ঞাপন */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(AdImage::class)->orderBy('sort_order')->orderBy('id');
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
