<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $cats = [
            ['mobile', 'মোবাইল ও ট্যাবলেট', '📱'],
            ['electronics', 'ইলেকট্রনিক্স', '💻'],
            ['vehicles', 'গাড়ি ও যানবাহন', '🚗'],
            ['property', 'প্রপার্টি ও জমি', '🏠'],
            ['fashion', 'ফ্যাশন ও সৌন্দর্য', '👗'],
            ['furniture', 'আসবাবপত্র ও গৃহসামগ্রী', '🛋️'],
            ['agriculture', 'কৃষি ও গবাদিপশু', '🐄'],
            ['handicrafts', 'হস্তশিল্প ও গ্রামীণ পণ্য', '🧺'],
            ['jobs', 'চাকরি', '💼'],
            ['services', 'সেবা', '🛠️'],
            ['hobbies', 'বই, খেলাধুলা ও শখ', '📚'],
            ['kids', 'শিশুদের জিনিস', '🧸'],
        ];

        foreach ($cats as $i => [$slug, $name, $icon]) {
            Category::updateOrCreate(['slug' => $slug], [
                'name' => $name, 'icon' => $icon, 'sort_order' => $i + 1, 'is_active' => true,
            ]);
        }
    }
}
