<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdResource;
use App\Models\Ad;
use App\Models\District;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AdController extends Controller
{
    private const WITH = ['category', 'division', 'district', 'images', 'user'];

    /* ================= পাবলিক ================= */

    public function index(Request $request)
    {
        $q = Ad::query()->approved()->with(self::WITH);

        if ($s = trim((string) $request->query('q'))) {
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%");
            });
        }
        if ($slug = $request->query('category')) {
            $q->whereHas('category', fn ($c) => $c->where('slug', $slug));
        }
        if ($d = $request->query('division')) {
            $q->where('division_id', $d);
        }
        if ($d = $request->query('district')) {
            $q->where('district_id', $d);
        }
        if (($min = $request->query('min_price')) !== null && $min !== '') {
            $q->where('price', '>=', (int) $min);
        }
        if (($max = $request->query('max_price')) !== null && $max !== '') {
            $q->where('price', '<=', (int) $max);
        }
        if (in_array($request->query('condition'), ['new', 'used'], true)) {
            $q->where('condition', $request->query('condition'));
        }

        match ($request->query('sort')) {
            'price_asc' => $q->orderByRaw('price is null')->orderBy('price'),
            'price_desc' => $q->orderByDesc('price'),
            'popular' => $q->orderByDesc('views'),
            default => $q->orderByDesc('id'),
        };

        $per = max(1, min((int) $request->query('per_page', 24), 48));

        return AdResource::collection($q->paginate($per)->withQueryString());
    }

    public function featured()
    {
        $ads = Ad::approved()->where('is_featured', true)->with(self::WITH)->latest('id')->limit(8)->get();

        return AdResource::collection($ads);
    }

    public function show(Request $request, Ad $ad)
    {
        $user = $request->user('sanctum');
        $isOwner = $user && $user->id === $ad->user_id;

        // অনুমোদিত/বিক্রিত সবাই দেখবে; পেন্ডিং/বাতিল শুধু মালিক ও অ্যাডমিন
        $visible = in_array($ad->status, ['approved', 'sold'], true) || $isOwner || ($user && $user->isAdmin());
        abort_unless($visible, 404, 'বিজ্ঞাপনটি পাওয়া যায়নি।');

        if (! $isOwner) {
            $ad->increment('views');
        }

        $ad->load(self::WITH);
        $ad->user->loadCount(['ads' => fn ($q) => $q->where('status', 'approved')]);

        $related = Ad::approved()
            ->where('category_id', $ad->category_id)
            ->where('id', '!=', $ad->id)
            ->with(self::WITH)->latest('id')->limit(4)->get();

        return response()->json([
            'data' => AdResource::make($ad)->resolve(),
            'related' => AdResource::collection($related)->resolve(),
        ]);
    }

    public function phone(Ad $ad)
    {
        abort_unless($ad->status === 'approved', 404, 'বিজ্ঞাপনটি পাওয়া যায়নি।');

        $phone = $ad->user->phone;
        abort_unless($phone, 404, 'বিক্রেতা ফোন নম্বর দেননি। মেসেজ পাঠান।');

        return response()->json(['phone' => $phone]);
    }

    /* ================= লগইন করা ইউজার ================= */

    public function myAds(Request $request)
    {
        $ads = $request->user()->ads()->with(self::WITH)->latest('id')->paginate(10);

        return AdResource::collection($ads);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(), $this->messages());
        $this->assertDistrictInDivision($data);

        $files = (array) $request->file('images', []);

        $ad = DB::transaction(function () use ($request, $data, $files) {
            $ad = Ad::create(array_merge(Arr::except($data, ['images']), [
                'user_id' => $request->user()->id,
                'negotiable' => $request->boolean('negotiable'),
                'status' => $this->autoApprove() ? 'approved' : 'pending',
            ]));
            $this->storeImages($ad, $files);

            return $ad;
        });

        return response()->json([
            'message' => $ad->status === 'approved'
                ? 'আপনার বিজ্ঞাপন লাইভ হয়েছে!'
                : 'বিজ্ঞাপন জমা হয়েছে। অনুমোদনের পর লাইভ হবে।',
            'data' => AdResource::make($ad->load(self::WITH))->resolve(),
        ], 201);
    }

    public function update(Request $request, Ad $ad)
    {
        $this->authorizeOwner($request, $ad);

        $rules = $this->rules() + [
            'remove_images' => 'nullable|array',
            'remove_images.*' => 'integer',
        ];
        $data = $request->validate($rules, $this->messages());
        $this->assertDistrictInDivision($data);

        $files = (array) $request->file('images', []);
        $removeIds = array_map('intval', (array) $request->input('remove_images', []));
        $toRemove = $ad->images()->whereIn('id', $removeIds)->get();

        $remaining = $ad->images()->count() - $toRemove->count() + count($files);
        if ($remaining > config('marketplace.max_images')) {
            throw ValidationException::withMessages(['images' => 'সর্বোচ্চ '.config('marketplace.max_images').'টি ছবি দেওয়া যাবে।']);
        }

        DB::transaction(function () use ($request, $ad, $data, $files, $toRemove) {
            $ad->fill(Arr::except($data, ['images', 'remove_images']));
            $ad->negotiable = $request->boolean('negotiable');

            // এডিটের পর আবার রিভিউয়ে যাবে (অটো-অ্যাপ্রুভ বন্ধ থাকলে)
            if ($ad->status === 'rejected') {
                $ad->status = $this->autoApprove() ? 'approved' : 'pending';
                $ad->rejection_reason = null;
            } elseif ($ad->status === 'approved' && ! $this->autoApprove()) {
                $ad->status = 'pending';
            }
            $ad->save();

            foreach ($toRemove as $img) {
                Storage::disk('uploads')->delete($img->path);
                $img->delete();
            }
            $this->storeImages($ad, $files);
        });

        return response()->json([
            'message' => 'বিজ্ঞাপন আপডেট হয়েছে।',
            'data' => AdResource::make($ad->fresh(self::WITH))->resolve(),
        ]);
    }

    public function destroy(Request $request, Ad $ad)
    {
        $this->authorizeOwner($request, $ad);

        foreach ($ad->images as $img) {
            Storage::disk('uploads')->delete($img->path);
        }
        $ad->delete();

        return response()->json(['message' => 'বিজ্ঞাপন মুছে ফেলা হয়েছে।']);
    }

    public function markSold(Request $request, Ad $ad)
    {
        $this->authorizeOwner($request, $ad);
        abort_unless($ad->status === 'approved', 422, 'শুধু লাইভ বিজ্ঞাপন বিক্রিত করা যায়।');

        $ad->update(['status' => 'sold']);

        return response()->json(['message' => 'বিক্রিত হিসেবে চিহ্নিত হয়েছে।']);
    }

    /* ================= হেল্পার ================= */

    private function rules(): array
    {
        $max = config('marketplace.max_images');
        $kb = config('marketplace.max_image_kb');

        return [
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|min:5|max:120',
            'description' => 'required|string|min:20|max:5000',
            'price' => 'nullable|integer|min:0|max:999999999',
            'negotiable' => 'nullable|boolean',
            'condition' => 'required|in:new,used',
            'division_id' => 'required|exists:divisions,id',
            'district_id' => 'required|exists:districts,id',
            'area' => 'nullable|string|max:120',
            'images' => "nullable|array|max:{$max}",
            'images.*' => "image|mimes:jpg,jpeg,png,webp|max:{$kb}",
        ];
    }

    private function messages(): array
    {
        return [
            'title.min' => 'শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।',
            'description.min' => 'বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে।',
            'images.max' => 'সর্বোচ্চ '.config('marketplace.max_images').'টি ছবি দেওয়া যাবে।',
            'images.*.image' => 'শুধু ছবি আপলোড করা যাবে।',
            'images.*.mimes' => 'ছবি অবশ্যই jpg, png বা webp ফরম্যাটের হতে হবে।',
            'images.*.max' => 'প্রতিটি ছবি ৩ এমবির বেশি হতে পারবে না।',
            'category_id.required' => 'ক্যাটাগরি বাছাই করুন।',
            'division_id.required' => 'বিভাগ বাছাই করুন।',
            'district_id.required' => 'জেলা বাছাই করুন।',
        ];
    }

    private function assertDistrictInDivision(array $data): void
    {
        $ok = District::where('id', $data['district_id'])->where('division_id', $data['division_id'])->exists();

        if (! $ok) {
            throw ValidationException::withMessages(['district_id' => 'জেলাটি নির্বাচিত বিভাগের অন্তর্গত নয়।']);
        }
    }

    private function authorizeOwner(Request $request, Ad $ad): void
    {
        $user = $request->user();
        abort_unless($user->id === $ad->user_id || $user->isAdmin(), 403, 'এই বিজ্ঞাপনে আপনার অনুমতি নেই।');
    }

    private function storeImages(Ad $ad, array $files): void
    {
        $order = (int) $ad->images()->max('sort_order');

        foreach ($files as $file) {
            $path = $file->store('ads', 'uploads');
            $ad->images()->create(['path' => $path, 'sort_order' => ++$order]);
        }
    }

    private function autoApprove(): bool
    {
        $v = Setting::get('auto_approve_ads', config('marketplace.auto_approve'));

        return filter_var($v, FILTER_VALIDATE_BOOLEAN);
    }
}
