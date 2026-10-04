<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $images = $this->relationLoaded('images') ? $this->images : collect();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'price' => $this->price,
            'negotiable' => $this->negotiable,
            'condition' => $this->condition,
            'status' => $this->status,
            'is_featured' => $this->is_featured,
            'views' => $this->views,
            'created_at' => $this->created_at,
            'thumbnail' => $images->first()?->url,
            'images' => $images->map(fn ($i) => ['id' => $i->id, 'url' => $i->url])->values(),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                'icon' => $this->category->icon,
            ]),
            'location' => [
                'division_id' => $this->division_id,
                'division' => $this->relationLoaded('division') ? $this->division?->name : null,
                'district_id' => $this->district_id,
                'district' => $this->relationLoaded('district') ? $this->district?->name : null,
                'area' => $this->area,
            ],
            'seller' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'member_since' => $this->user->created_at?->format('Y'),
                'ads_count' => $this->user->ads_count ?? 0,
            ]),
        ];
    }
}
