<?php

use App\Http\Controllers\Api\AdController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

/* ---------- পাবলিক ---------- */
Route::get('/categories', [MetaController::class, 'categories']);
Route::get('/locations', [MetaController::class, 'locations']);
Route::get('/settings', [MetaController::class, 'settings']);
Route::get('/stats', [MetaController::class, 'stats']);

Route::get('/ads', [AdController::class, 'index']);
Route::get('/ads/featured', [AdController::class, 'featured']);
Route::get('/ads/{ad}', [AdController::class, 'show'])->whereNumber('ad')->name('ads.show');
Route::get('/ads/{ad}/phone', [AdController::class, 'phone'])->whereNumber('ad')->middleware('throttle:40,1');

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:15,1');

/* ---------- লগইন করা ইউজার ---------- */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword']);

    Route::get('/my/ads', [AdController::class, 'myAds']);
    Route::post('/ads', [AdController::class, 'store'])->middleware('throttle:30,1');
    Route::put('/ads/{ad}', [AdController::class, 'update'])->whereNumber('ad');
    Route::delete('/ads/{ad}', [AdController::class, 'destroy'])->whereNumber('ad');
    Route::post('/ads/{ad}/sold', [AdController::class, 'markSold'])->whereNumber('ad');

    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::get('/favorites/ids', [FavoriteController::class, 'ids']);
    Route::post('/ads/{ad}/favorite', [FavoriteController::class, 'toggle'])->whereNumber('ad');

    Route::post('/ads/{ad}/report', [ReportController::class, 'store'])->whereNumber('ad')->middleware('throttle:10,1');

    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::get('/conversations/{ad}/{user}', [MessageController::class, 'thread'])->whereNumber(['ad', 'user']);
    Route::post('/messages', [MessageController::class, 'store'])->middleware('throttle:60,1');
});

/* ---------- অ্যাডমিন প্যানেল ---------- */
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    Route::get('/ads', [AdminController::class, 'ads']);
    Route::post('/ads/{ad}/approve', [AdminController::class, 'approveAd'])->whereNumber('ad');
    Route::post('/ads/{ad}/reject', [AdminController::class, 'rejectAd'])->whereNumber('ad');
    Route::post('/ads/{ad}/feature', [AdminController::class, 'toggleFeatured'])->whereNumber('ad');
    Route::delete('/ads/{ad}', [AdminController::class, 'deleteAd'])->whereNumber('ad');

    Route::get('/users', [AdminController::class, 'users']);
    Route::post('/users/{user}/toggle', [AdminController::class, 'toggleUser'])->whereNumber('user');
    Route::post('/users/{user}/role', [AdminController::class, 'changeRole'])->whereNumber('user');
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->whereNumber('user');

    Route::get('/reports', [AdminController::class, 'reports']);
    Route::post('/reports/{report}/resolve', [AdminController::class, 'resolveReport'])->whereNumber('report');

    Route::get('/categories', [AdminController::class, 'categories']);
    Route::post('/categories', [AdminController::class, 'storeCategory']);
    Route::put('/categories/{category}', [AdminController::class, 'updateCategory'])->whereNumber('category');
    Route::delete('/categories/{category}', [AdminController::class, 'deleteCategory'])->whereNumber('category');

    Route::get('/settings', [AdminController::class, 'settings']);
    Route::put('/settings', [AdminController::class, 'updateSettings']);
});
