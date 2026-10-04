<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LocationSeeder::class,
            CategorySeeder::class,
            SettingSeeder::class,
            UserSeeder::class,
            AdSeeder::class,
        ]);
    }
}
