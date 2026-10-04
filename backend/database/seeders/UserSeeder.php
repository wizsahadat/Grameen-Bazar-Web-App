<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $dhaka = District::where('name', 'ঢাকা')->first();

        // অ্যাডমিন (পরের ধাপের অ্যাডমিন প্যানেলে এই অ্যাকাউন্ট দিয়ে ঢুকবেন)
        User::updateOrCreate(['email' => 'admin@grameen.com'], [
            'name' => 'অ্যাডমিন',
            'phone' => '01700000000',
            'password' => 'admin123',
            'role' => 'admin',
            'division_id' => $dhaka?->division_id,
            'district_id' => $dhaka?->id,
        ]);

        $demo = [
            ['রহিমা বেগম', 'rahima@gmail.com', '01711111111', 'ময়মনসিংহ'],
            ['করিম উদ্দিন', 'karim@gmail.com', '01722222222', 'রাজশাহী'],
            ['আনোয়ার হোসেন', 'anwar@gmail.com', '01733333333', 'সিলেট'],
            ['মোস্তফা কামাল', 'mostafa@gmail.com', '01744444444', 'খুলনা'],
            ['সালমা খাতুন', 'salma@gmail.com', '01755555555', 'ঢাকা'],
        ];

        foreach ($demo as [$name, $email, $phone, $districtName]) {
            $district = District::where('name', $districtName)->first();
            User::updateOrCreate(['email' => $email], [
                'name' => $name, 'phone' => $phone, 'password' => '123456', 'role' => 'user',
                'division_id' => $district?->division_id, 'district_id' => $district?->id,
            ]);
        }
    }
}
