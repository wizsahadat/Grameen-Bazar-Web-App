# 🌾 গ্রামীণ বাজার v2 — Bikroy-style ক্লাসিফাইড মার্কেটপ্লেস

**Backend:** Laravel 11 (REST API + Sanctum token auth) · **Frontend:** React 18 + Vite + React Router
**ধাপ ১:** পাবলিক ফ্রন্টএন্ড + পুরো API  ·  **ধাপ ২ (এই প্যাকেজে যুক্ত):** অ্যাডমিন প্যানেল (`/admin`)

## কী কী আছে
- হোম পেজ: সার্চ বার (বিভাগ সহ), ক্যাটাগরি গ্রিড, ফিচার্ড ও সর্বশেষ বিজ্ঞাপন, লাইভ স্ট্যাটস
- বিজ্ঞাপন তালিকা: কীওয়ার্ড / ক্যাটাগরি / বিভাগ-জেলা / দাম / নতুন-ব্যবহৃত ফিল্টার, সর্ট, গ্রিড-লিস্ট ভিউ, পেজিনেশন (URL এ ফিল্টার থাকে, শেয়ার করা যায়)
- বিজ্ঞাপন ডিটেইল: ছবির গ্যালারি, "ফোন নম্বর দেখুন", বিক্রেতাকে মেসেজ, পছন্দ, শেয়ার, রিপোর্ট, সম্পর্কিত বিজ্ঞাপন
- বিজ্ঞাপন দিন / এডিট (৫টি পর্যন্ত ছবি), আমার বিজ্ঞাপন (বিক্রিত চিহ্নিত, মোছা), পছন্দের তালিকা
- ইনবক্স (ক্রেতা ↔ বিক্রেতা চ্যাট), প্রোফাইল ও পাসওয়ার্ড পরিবর্তন
- ৮ বিভাগ ও ৬৪ জেলার ড্রপডাউন, ১২টি ক্যাটাগরি, সাইট সেটিংস (হিরো টেক্সট, যোগাযোগ, ফুটার) ডাটাবেস থেকে আসে — অ্যাডমিন প্যানেল থেকে বদলানো যাবে
- মোবাইল-ফ্রেন্ডলি (নিচে বটম নেভ), বাংলা সংখ্যা ও "x মিনিট আগে" ফরম্যাট

> বদল: আগের প্রজেক্টের কার্ট/চেকআউট ছিল, Bikroy মডেলে সেটা নেই — ক্রেতা সরাসরি ফোন/মেসেজে বিক্রেতার সাথে কথা বলে।

## লোকালি চালানো (XAMPP)
দরকার: PHP 8.2+, Composer, Node.js 18+, XAMPP এর MySQL চালু।

```bash
# ১) phpMyAdmin এ "grameen_bazar" নামে ডাটাবেস বানান (utf8mb4_unicode_ci)

# ২) Backend
cd backend
composer install
php artisan key:generate
php artisan migrate --seed       # টেবিল + ডেমো ডাটা
php artisan serve                # → http://127.0.0.1:8000

# ৩) Frontend (আরেকটি টার্মিনালে)
cd frontend
npm install
npm run dev                      # → http://localhost:3000
```

`backend/.env` এ ডাটাবেস ইউজার/পাসওয়ার্ড বদলাতে হলে সেখানে দিন (XAMPP ডিফল্ট: root, পাসওয়ার্ড ফাঁকা)।

### ডেমো অ্যাকাউন্ট
| ভূমিকা | ইমেইল | পাসওয়ার্ড |
|---|---|---|
| অ্যাডমিন (`/admin` এ ঢুকতে) | admin@grameen.com | admin123 |
| ইউজার | rahima@gmail.com | 123456 |
| ইউজার | karim@gmail.com | 123456 |

## শুধু PHP দিয়ে চালানো (Node ছাড়া)
`backend/public` এ React এর বিল্ড (`app.html` + `assets/`) আগে থেকেই দেওয়া আছে। তাই শুধু `php artisan serve` চালিয়ে http://127.0.0.1:8000 খুললেই পুরো সাইট চলবে।
ফ্রন্টএন্ডে কিছু বদলালে: `cd frontend && npm run build:laravel` — নতুন বিল্ড নিজেই backend/public এ কপি হয়ে যাবে।

## লাইভ করা (FileZilla / কোনো SSH নেই)
1. লোকালে `composer install --no-dev` চালান, তারপর পুরো `backend` ফোল্ডার (**`vendor` সহ**) হোস্টে আপলোড করুন
2. হোস্টের document root কে `backend/public` এ পয়েন্ট করুন (না পারলে `public` এর ভেতরের সব কিছু `public_html` এ রেখে `index.php` এর `../` পাথ ঠিক করুন)
3. `.env` এডিট করুন: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://আপনার-ডোমেইন`, হোস্টের DB তথ্য
4. SSH না থাকলে লোকাল ডাটাবেস phpMyAdmin থেকে Export করে হোস্টের phpMyAdmin এ Import করুন
5. `storage` ও `bootstrap/cache` এবং `public/uploads` ফোল্ডারে write permission (755/775) দিন
6. ছবি `public/uploads` এ জমা হয় — `storage:link` লাগে না

## প্রজেক্ট কাঠামো
```
backend/
  app/Http/Controllers/Api/   Auth, Ad, Favorite, Message, Report, Meta
  app/Models/                 User, Ad, AdImage, Category, Division, District, Message, Report, Setting
  app/Http/Middleware/EnsureAdmin.php   ← ধাপ ২ এর জন্য তৈরি
  database/migrations + seeders         ← ৮ বিভাগ/৬৪ জেলা, ১২ ক্যাটাগরি, ২৫টি ডেমো বিজ্ঞাপন
  routes/api.php
frontend/
  src/pages/       Home, Ads, AdDetail, PostAd, Auth, MyAds, Favorites, Messages, Profile
  src/components/  Navbar, Footer, AdCard, Pagination, LocationSelect, UI
  src/context/     Auth, Meta (ক্যাটাগরি/লোকেশন/সেটিংস), Toast
```

## API তালিকা (`/api`)
পাবলিক: `GET categories · locations · settings · stats · ads · ads/featured · ads/{id} · ads/{id}/phone` · `POST register · login`
লগইন লাগে: `GET me · my/ads · favorites · favorites/ids · conversations · conversations/{ad}/{user}` · `PUT me · me/password · ads/{id}` (ছবিসহ হলে POST + `_method=PUT`) · `POST ads · ads/{id}/sold · ads/{id}/favorite · ads/{id}/report · messages · logout` · `DELETE ads/{id}`

## অ্যাডমিন প্যানেল (`/admin`)
`admin@grameen.com / admin123` দিয়ে লগইন করে ডান-উপরের মেনু থেকে "🛠️ অ্যাডমিন প্যানেল" চাপুন, অথবা সরাসরি `/admin` খুলুন।
- **ড্যাশবোর্ড:** ইউজার/বিজ্ঞাপন/রিপোর্টের পরিসংখ্যান, অনুমোদনের অপেক্ষায় থাকা বিজ্ঞাপন
- **বিজ্ঞাপন:** স্ট্যাটাস ফিল্টার ও সার্চ, অনুমোদন, কারণসহ বাতিল, ফিচার্ড, মোছা
- **ইউজার:** সার্চ, অ্যাকাউন্ট বন্ধ/চালু (বন্ধ করলে সব লগইন সেশন শেষ), অ্যাডমিন/ইউজার রোল বদল, মোছা
- **রিপোর্ট:** বিজ্ঞাপন সরানো / সমাধান / উপেক্ষা
- **ক্যাটাগরি:** যোগ, এডিট, লুকানো, মোছা (বিজ্ঞাপন থাকলে মোছা যায় না)
- **সেটিংস:** অটো-অ্যাপ্রুভ চালু/বন্ধ, সাইটের নাম, হিরো টেক্সট, যোগাযোগ, ফুটার
API: `/api/admin/*` (শুধু অ্যাডমিন টোকেন)। Node ছাড়া চালালে `cd frontend && npm run build:laravel` চালিয়ে নতুন বিল্ড কপি করুন।

## নতুন বিজ্ঞাপন অনুমোদন
ডিফল্টে বিজ্ঞাপন সাথে সাথে লাইভ হয়। অ্যাডমিন প্যানেলের **সেটিংস** থেকে অটো-অ্যাপ্রুভ বন্ধ করলে প্রতিটি নতুন বিজ্ঞাপন pending থাকবে, অ্যাডমিন অনুমোদন করলে লাইভ হবে।
