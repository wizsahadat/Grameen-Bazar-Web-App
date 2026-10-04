<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Category;
use App\Models\Division;
use App\Models\Setting;
use App\Models\User;

class MetaController extends Controller
{
    /** ফ্রন্টএন্ডে দেখানো যাবে এমন সেটিংস কী — বাকিগুলো পাবলিক API তে যাবে না */
    public const PUBLIC_SETTINGS = [
        'site_name', 'tagline', 'hero_title', 'hero_subtitle',
        'contact_phone', 'contact_email', 'facebook_url', 'footer_text',
    ];

    public function categories()
    {
        $rows = Category::where('is_active', true)
            ->withCount(['ads' => fn ($q) => $q->where('status', 'approved')])
            ->orderBy('sort_order')->orderBy('id')
            ->get(['id', 'name', 'slug', 'icon']);

        return response()->json(['data' => $rows]);
    }

    public function locations()
    {
        $rows = Division::with(['districts' => fn ($q) => $q->orderBy('name')->select('id', 'division_id', 'name')])
            ->orderBy('id')
            ->get(['id', 'name']);

        return response()->json(['data' => $rows]);
    }

    public function settings()
    {
        $data = Setting::whereIn('key', self::PUBLIC_SETTINGS)->pluck('value', 'key');

        return response()->json(['data' => $data]);
    }

    public function stats()
    {
        return response()->json(['data' => [
            'ads' => Ad::where('status', 'approved')->count(),
            'users' => User::where('role', 'user')->count(),
            'categories' => Category::where('is_active', true)->count(),
        ]]);
    }
}
