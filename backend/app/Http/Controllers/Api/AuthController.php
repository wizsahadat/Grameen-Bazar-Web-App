<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\District;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email|max:120|unique:users,email',
            'phone' => ['required', 'regex:/^01[3-9][0-9]{8}$/'],
            'password' => 'required|string|min:6|max:100|confirmed',
        ], [
            'email.unique' => 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে।',
            'phone.regex' => 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)।',
            'password.min' => 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
            'password.confirmed' => 'পাসওয়ার্ড দুটি মিলছে না।',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'],
            'password' => $data['password'],
            'role' => 'user',
        ]);

        return response()->json([
            'user' => UserResource::make($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'ইমেইল বা পাসওয়ার্ড ভুল।']);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages(['email' => 'আপনার অ্যাকাউন্টটি বন্ধ করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।']);
        }

        return response()->json([
            'user' => UserResource::make($user),
            'token' => $user->createToken('web')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'লগআউট হয়েছে']);
    }

    public function me(Request $request)
    {
        return UserResource::make($request->user());
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'phone' => ['required', 'regex:/^01[3-9][0-9]{8}$/'],
            'division_id' => 'nullable|exists:divisions,id',
            'district_id' => 'nullable|exists:districts,id',
        ], [
            'phone.regex' => 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)।',
        ]);

        if (! empty($data['district_id']) && ! District::where('id', $data['district_id'])->where('division_id', $data['division_id'] ?? 0)->exists()) {
            throw ValidationException::withMessages(['district_id' => 'জেলাটি নির্বাচিত বিভাগের অন্তর্গত নয়।']);
        }

        $request->user()->update($data);

        return UserResource::make($request->user()->fresh());
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|max:100|confirmed',
        ], [
            'password.confirmed' => 'নতুন পাসওয়ার্ড দুটি মিলছে না।',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'বর্তমান পাসওয়ার্ড ভুল।']);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'পাসওয়ার্ড বদলানো হয়েছে']);
    }
}
