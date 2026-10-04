<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdResource;
use App\Models\Ad;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $ads = $request->user()->favorites()
            ->whereIn('ads.status', ['approved', 'sold'])
            ->with(['category', 'division', 'district', 'images', 'user'])
            ->orderByDesc('favorites.id')
            ->paginate(24);

        return AdResource::collection($ads);
    }

    public function ids(Request $request)
    {
        return response()->json(['data' => $request->user()->favorites()->pluck('ads.id')->map(fn ($i) => (int) $i)]);
    }

    public function toggle(Request $request, Ad $ad)
    {
        $result = $request->user()->favorites()->toggle($ad->id);

        return response()->json(['favorited' => count($result['attached']) > 0]);
    }
}
