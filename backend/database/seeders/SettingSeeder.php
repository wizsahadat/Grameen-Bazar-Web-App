<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'site_name' => 'গ্রামীণ বাজার',
            'tagline' => 'কিনুন, বিক্রি করুন — সহজে, নিরাপদে',
            'hero_title' => 'আপনার যা খুশি কিনুন ও বিক্রি করুন',
            'hero_subtitle' => 'সারা বাংলাদেশের হাজারো বিজ্ঞাপন এক জায়গায়',
            'contact_phone' => '01700-000000',
            'contact_email' => 'info@grameenbazar.com',
            'facebook_url' => '',
            'footer_text' => '© গ্রামীণ বাজার। সর্বস্বত্ব সংরক্ষিত।',
            'auto_approve_ads' => '1',
        ];

        foreach ($defaults as $key => $value) {
            // আগে থেকে বদলানো থাকলে ওভাররাইট করবে না
            Setting::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
