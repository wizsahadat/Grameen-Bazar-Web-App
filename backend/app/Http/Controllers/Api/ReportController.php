<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request, Ad $ad)
    {
        $data = $request->validate([
            'reason' => 'required|string|max:120',
            'details' => 'nullable|string|max:1000',
        ]);

        // একই ইউজার একই বিজ্ঞাপন বারবার রিপোর্ট করলে নতুন রেকর্ড না বানিয়ে আপডেট হবে
        Report::updateOrCreate(
            ['ad_id' => $ad->id, 'user_id' => $request->user()->id],
            $data + ['status' => 'open']
        );

        return response()->json(['message' => 'রিপোর্ট জমা হয়েছে।'], 201);
    }
}
