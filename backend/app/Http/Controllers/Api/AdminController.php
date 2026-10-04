<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdResource;
use App\Models\Ad;
use App\Models\Category;
use App\Models\Message;
use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * অ্যাডমিন প্যানেলের সব API (রুট: /api/admin/*, middleware: auth:sanctum + admin)
 */
class AdminController extends Controller
{
    /** অ্যাডমিন সেটিংসে বদলানো যায় এমন কী (টেক্সট) */
    private const TEXT_SETTINGS = [
        'site_name', 'tagline', 'hero_title', 'hero_subtitle',
        'contact_phone', 'contact_email', 'facebook_url', 'footer_text',
    ];

    /* ================= ড্যাশবোর্ড ================= */

    public function dashboard()
    {
        $statusCounts = Ad::select('status', DB::raw('count(*) as c'))->groupBy('status')->pluck('c', 'status');

        $topCategories = Category::withCount(['ads' => fn ($q) => $q->where('status', 'approved')])
            ->orderByDesc('ads_count')->limit(5)->get(['id', 'name', 'icon']);

        $pending = Ad::with(['category', 'user', 'images'])
            ->where('status', 'pending')->latest('id')->limit(6)->get();

        return response()->json(['data' => [
            'users' => User::where('role', 'user')->count(),
            'users_today' => User::where('role', 'user')->whereDate('created_at', today())->count(),
            'banned_users' => User::where('is_active', false)->count(),
            'ads_total' => Ad::count(),
            'ads_today' => Ad::whereDate('created_at', today())->count(),
            'ads_by_status' => [
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'approved' => (int) ($statusCounts['approved'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'sold' => (int) ($statusCounts['sold'] ?? 0),
            ],
            'open_reports' => Report::where('status', 'open')->count(),
            'messages' => Message::count(),
            'views' => (int) Ad::sum('views'),
            'top_categories' => $topCategories,
            'pending_ads' => $pending->map(fn ($a) => $this->adPayload($a))->values(),
        ]]);
    }

    /* ================= বিজ্ঞাপন ================= */

    public function ads(Request $request)
    {
        $q = Ad::query()->with(['category', 'division', 'district', 'images', 'user'])->withCount('reports');

        if (in_array($request->query('status'), ['pending', 'approved', 'rejected', 'sold'], true)) {
            $q->where('status', $request->query('status'));
        }
        if ($s = trim((string) $request->query('q'))) {
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
            });
        }
        if ($request->boolean('featured')) {
            $q->where('is_featured', true);
        }

        $page = $q->orderByDesc('id')->paginate(15)->withQueryString();
        $page->getCollection()->transform(fn ($a) => $this->adPayload($a));

        return response()->json($page);
    }

    public function approveAd(Ad $ad)
    {
        $ad->update(['status' => 'approved', 'rejection_reason' => null]);

        return response()->json(['message' => 'বিজ্ঞাপন অনুমোদিত হয়েছে।', 'data' => $this->adPayload($ad->fresh(['category', 'user', 'images']))]);
    }

    public function rejectAd(Request $request, Ad $ad)
    {
        $data = $request->validate(['reason' => 'required|string|max:255'], [
            'reason.required' => 'বাতিলের কারণ লিখুন।',
        ]);

        $ad->update(['status' => 'rejected', 'rejection_reason' => $data['reason'], 'is_featured' => false]);

        return response()->json(['message' => 'বিজ্ঞাপন বাতিল করা হয়েছে।', 'data' => $this->adPayload($ad->fresh(['category', 'user', 'images']))]);
    }

    public function toggleFeatured(Ad $ad)
    {
        if (! $ad->is_featured && $ad->status !== 'approved') {
            throw ValidationException::withMessages(['ad' => 'শুধু লাইভ বিজ্ঞাপন ফিচার্ড করা যায়।']);
        }

        $ad->update(['is_featured' => ! $ad->is_featured]);

        return response()->json([
            'message' => $ad->is_featured ? 'ফিচার্ড করা হয়েছে।' : 'ফিচার্ড থেকে সরানো হয়েছে।',
            'data' => $this->adPayload($ad->fresh(['category', 'user', 'images'])),
        ]);
    }

    public function deleteAd(Ad $ad)
    {
        foreach ($ad->images as $img) {
            Storage::disk('uploads')->delete($img->path);
        }
        $ad->delete();

        return response()->json(['message' => 'বিজ্ঞাপন মুছে ফেলা হয়েছে।']);
    }

    /* ================= ইউজার ================= */

    public function users(Request $request)
    {
        $q = User::query()->withCount('ads')->with('district:id,name');

        if ($s = trim((string) $request->query('q'))) {
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%");
            });
        }
        if (in_array($request->query('role'), ['user', 'admin'], true)) {
            $q->where('role', $request->query('role'));
        }
        if ($request->query('active') === '0') {
            $q->where('is_active', false);
        }

        $page = $q->orderByDesc('id')->paginate(15)->withQueryString();
        $page->getCollection()->transform(fn ($u) => $this->userPayload($u));

        return response()->json($page);
    }

    public function toggleUser(Request $request, User $user)
    {
        $this->notSelf($request, $user, 'নিজের অ্যাকাউন্ট বন্ধ করা যাবে না।');

        $user->update(['is_active' => ! $user->is_active]);

        // বন্ধ করলে চালু থাকা সব লগইন সেশন শেষ
        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $user->is_active ? 'অ্যাকাউন্ট চালু করা হয়েছে।' : 'অ্যাকাউন্ট বন্ধ করা হয়েছে।',
            'data' => $this->userPayload($user->loadCount('ads')),
        ]);
    }

    public function changeRole(Request $request, User $user)
    {
        $this->notSelf($request, $user, 'নিজের রোল বদলানো যাবে না।');

        $data = $request->validate(['role' => ['required', Rule::in(['user', 'admin'])]]);
        $user->update($data);

        return response()->json(['message' => 'রোল বদলানো হয়েছে।', 'data' => $this->userPayload($user->loadCount('ads'))]);
    }

    public function deleteUser(Request $request, User $user)
    {
        $this->notSelf($request, $user, 'নিজের অ্যাকাউন্ট মোছা যাবে না।');

        if ($user->isAdmin()) {
            throw ValidationException::withMessages(['user' => 'অ্যাডমিনকে আগে সাধারণ ইউজার বানান, তারপর মুছুন।']);
        }

        foreach ($user->ads()->with('images')->get() as $ad) {
            foreach ($ad->images as $img) {
                Storage::disk('uploads')->delete($img->path);
            }
        }
        $user->tokens()->delete();
        $user->delete(); // বিজ্ঞাপন, মেসেজ, ফেভারিট cascade এ মুছে যাবে

        return response()->json(['message' => 'ইউজার ও তার সব বিজ্ঞাপন মুছে ফেলা হয়েছে।']);
    }

    /* ================= রিপোর্ট ================= */

    public function reports(Request $request)
    {
        $q = Report::query()->with(['ad.images', 'ad.category', 'ad.user', 'user:id,name,email']);

        $status = $request->query('status', 'open');
        if (in_array($status, ['open', 'resolved', 'dismissed'], true)) {
            $q->where('status', $status);
        }

        $page = $q->orderByDesc('id')->paginate(15)->withQueryString();
        $page->getCollection()->transform(fn ($r) => [
            'id' => $r->id,
            'reason' => $r->reason,
            'details' => $r->details,
            'status' => $r->status,
            'created_at' => $r->created_at,
            'reporter' => $r->user ? ['id' => $r->user->id, 'name' => $r->user->name, 'email' => $r->user->email] : null,
            'ad' => $r->ad ? $this->adPayload($r->ad) : null,
        ]);

        return response()->json($page);
    }

    public function resolveReport(Request $request, Report $report)
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['resolved', 'dismissed'])],
            'remove_ad' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($report, $data, $request) {
            // বিজ্ঞাপন সরালে (বাতিল) ওই বিজ্ঞাপনের সব ওপেন রিপোর্ট একসাথে সমাধান হয়
            if ($request->boolean('remove_ad') && $report->ad) {
                $report->ad->update([
                    'status' => 'rejected',
                    'is_featured' => false,
                    'rejection_reason' => 'রিপোর্টের ভিত্তিতে অ্যাডমিন সরিয়েছেন: '.Str::limit($report->reason, 120, ''),
                ]);
                Report::where('ad_id', $report->ad_id)->where('status', 'open')->update(['status' => 'resolved']);
            }
            $report->update(['status' => $data['action']]);
        });

        return response()->json(['message' => 'রিপোর্ট আপডেট হয়েছে।']);
    }

    /* ================= ক্যাটাগরি ================= */

    public function categories()
    {
        $rows = Category::withCount('ads')->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $rows]);
    }

    public function storeCategory(Request $request)
    {
        $data = $this->categoryData($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['sort_order'] = $data['sort_order'] ?? ((int) Category::max('sort_order') + 1);

        $cat = Category::create($data);

        return response()->json(['message' => 'ক্যাটাগরি যোগ হয়েছে।', 'data' => $cat], 201);
    }

    public function updateCategory(Request $request, Category $category)
    {
        $category->update($this->categoryData($request));

        return response()->json(['message' => 'ক্যাটাগরি আপডেট হয়েছে।', 'data' => $category->fresh()]);
    }

    public function deleteCategory(Category $category)
    {
        if ($category->ads()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'এই ক্যাটাগরিতে বিজ্ঞাপন আছে, তাই মোছা যাবে না। চাইলে ক্যাটাগরিটি লুকিয়ে (নিষ্ক্রিয়) রাখুন।',
            ]);
        }
        $category->delete();

        return response()->json(['message' => 'ক্যাটাগরি মুছে ফেলা হয়েছে।']);
    }

    /* ================= সেটিংস ================= */

    public function settings()
    {
        $stored = Setting::pluck('value', 'key');
        $out = [];
        foreach (self::TEXT_SETTINGS as $k) {
            $out[$k] = $stored[$k] ?? '';
        }
        $out['auto_approve_ads'] = filter_var(
            $stored['auto_approve_ads'] ?? config('marketplace.auto_approve'),
            FILTER_VALIDATE_BOOLEAN
        );

        return response()->json(['data' => $out]);
    }

    public function updateSettings(Request $request)
    {
        $rules = ['auto_approve_ads' => 'nullable|boolean'];
        foreach (self::TEXT_SETTINGS as $k) {
            $rules[$k] = 'nullable|string|max:255';
        }
        $rules['contact_email'] = 'nullable|email|max:255';
        $rules['facebook_url'] = 'nullable|url|max:255';

        $data = $request->validate($rules, [
            'contact_email.email' => 'সঠিক ইমেইল দিন।',
            'facebook_url.url' => 'ফেসবুক লিংক সম্পূর্ণ দিন (https://… দিয়ে)।',
        ]);

        foreach (self::TEXT_SETTINGS as $k) {
            if (array_key_exists($k, $data)) {
                Setting::put($k, $data[$k] ?? '');
            }
        }
        if (array_key_exists('auto_approve_ads', $data)) {
            Setting::put('auto_approve_ads', $request->boolean('auto_approve_ads') ? '1' : '0');
        }

        return response()->json([
            'message' => 'সেটিংস সংরক্ষণ হয়েছে।',
            'data' => $this->settings()->getData(true)['data'],
        ]);
    }

    /* ================= হেল্পার ================= */

    private function adPayload(Ad $ad): array
    {
        $base = AdResource::make($ad)->resolve();

        return array_merge($base, [
            'rejection_reason' => $ad->rejection_reason,
            'reports_count' => $ad->reports_count ?? null,
            'seller' => $ad->relationLoaded('user') && $ad->user ? [
                'id' => $ad->user->id,
                'name' => $ad->user->name,
                'email' => $ad->user->email,
                'phone' => $ad->user->phone,
                'is_active' => (bool) $ad->user->is_active,
            ] : null,
        ]);
    }

    private function userPayload(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'role' => $u->role,
            'is_active' => (bool) $u->is_active,
            'ads_count' => $u->ads_count ?? 0,
            'district' => $u->relationLoaded('district') ? $u->district?->name : null,
            'created_at' => $u->created_at,
        ];
    }

    private function notSelf(Request $request, User $user, string $msg): void
    {
        if ($request->user()->id === $user->id) {
            throw ValidationException::withMessages(['user' => $msg]);
        }
    }

    private function categoryData(Request $request): array
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:60',
            'icon' => 'nullable|string|max:16',
            'sort_order' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'nullable|boolean',
        ], ['name.required' => 'ক্যাটাগরির নাম লিখুন।']);

        $data['icon'] = $data['icon'] ?: '📦';
        $data['is_active'] = $request->boolean('is_active', true);

        return $data;
    }

    private function uniqueSlug(string $name): string
    {
        // বাংলা নাম থেকে Str::slug ফাঁকা আসতে পারে, তাই fallback
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $i = 2;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
