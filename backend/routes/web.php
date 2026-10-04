<?php

use Illuminate\Support\Facades\Route;

// React বিল্ড (public/app.html) থাকলে সব ফ্রন্টএন্ড রুট সেটাই সার্ভ করবে।
// না থাকলে (dev মোডে) শুধু একটি JSON মেসেজ দেখাবে।
Route::get('/{any?}', function () {
    $app = public_path('app.html');

    if (is_file($app)) {
        return response()->file($app, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    return response()->json([
        'app' => config('app.name'),
        'message' => 'Grameen Bazar API চালু আছে। ফ্রন্টএন্ড চালাতে frontend ফোল্ডারে `npm run dev` দিন।',
        'try' => url('/api/categories'),
    ]);
})->where('any', '^(?!api|uploads|up).*$');
