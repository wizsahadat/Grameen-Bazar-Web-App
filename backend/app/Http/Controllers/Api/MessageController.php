<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /** ইনবক্স — বিজ্ঞাপন + অপর পক্ষ অনুযায়ী গ্রুপ করা কথোপকথন */
    public function conversations(Request $request)
    {
        $me = $request->user();

        $messages = Message::where(fn ($q) => $q->where('from_user_id', $me->id)->orWhere('to_user_id', $me->id))
            ->with(['ad:id,title', 'from:id,name', 'to:id,name'])
            ->orderByDesc('id')
            ->get();

        $convs = [];
        foreach ($messages as $m) {
            $other = $m->from_user_id === $me->id ? $m->to : $m->from;
            $key = $m->ad_id.'-'.$other->id;

            if (! isset($convs[$key])) {
                $convs[$key] = [
                    'ad' => ['id' => $m->ad->id, 'title' => $m->ad->title],
                    'other' => ['id' => $other->id, 'name' => $other->name],
                    'last_message' => $m->body,
                    'last_at' => $m->created_at,
                    'unread' => 0,
                ];
            }
            if ($m->to_user_id === $me->id && ! $m->read_at) {
                $convs[$key]['unread']++;
            }
        }

        return response()->json(['data' => array_values($convs)]);
    }

    public function thread(Request $request, Ad $ad, User $user)
    {
        $me = $request->user();

        $messages = Message::where('ad_id', $ad->id)
            ->where(function ($q) use ($me, $user) {
                $q->where(fn ($x) => $x->where('from_user_id', $me->id)->where('to_user_id', $user->id))
                  ->orWhere(fn ($x) => $x->where('from_user_id', $user->id)->where('to_user_id', $me->id));
            })
            ->orderBy('id')
            ->get();

        // আমার কাছে আসা মেসেজগুলো পড়া হয়েছে চিহ্নিত
        Message::where('ad_id', $ad->id)->where('from_user_id', $user->id)->where('to_user_id', $me->id)
            ->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'data' => $messages->map(fn ($m) => [
                'id' => $m->id,
                'body' => $m->body,
                'mine' => $m->from_user_id === $me->id,
                'created_at' => $m->created_at,
            ])->values(),
            'ad' => ['id' => $ad->id, 'title' => $ad->title],
            'other' => ['id' => $user->id, 'name' => $user->name],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'ad_id' => 'required|exists:ads,id',
            'to_user_id' => 'required|exists:users,id',
            'body' => 'required|string|min:2|max:1000',
        ]);

        $me = $request->user();
        $ad = Ad::findOrFail($data['ad_id']);

        abort_if((int) $data['to_user_id'] === $me->id, 422, 'নিজেকে মেসেজ পাঠানো যাবে না।');

        if ($me->id === $ad->user_id) {
            // বিক্রেতা শুধু তাকেই রিপ্লাই দিতে পারবে যে আগে মেসেজ করেছে
            $hasThread = Message::where('ad_id', $ad->id)
                ->where('from_user_id', $data['to_user_id'])->where('to_user_id', $me->id)->exists();
            abort_unless($hasThread, 403, 'এই ইউজার আপনাকে মেসেজ করেনি।');
        } else {
            // ক্রেতা শুধু বিজ্ঞাপনদাতাকেই মেসেজ করতে পারবে
            abort_unless((int) $data['to_user_id'] === $ad->user_id, 403, 'ভুল প্রাপক।');
            abort_unless(in_array($ad->status, ['approved', 'sold'], true), 404, 'বিজ্ঞাপনটি পাওয়া যায়নি।');
        }

        $msg = Message::create([
            'ad_id' => $ad->id,
            'from_user_id' => $me->id,
            'to_user_id' => $data['to_user_id'],
            'body' => trim($data['body']),
        ]);

        return response()->json(['message' => 'মেসেজ পাঠানো হয়েছে।', 'id' => $msg->id], 201);
    }
}
