<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('division_id')->constrained('divisions');
            $table->foreignId('district_id')->constrained('districts');
            $table->string('area', 120)->nullable();
            $table->string('title', 120);
            $table->text('description');
            $table->unsignedBigInteger('price')->nullable();
            $table->boolean('negotiable')->default(false);
            $table->string('condition', 10)->default('used'); // new | used
            $table->string('status', 12)->default('pending')->index(); // pending | approved | rejected | sold
            $table->string('rejection_reason')->nullable();
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('views')->default(0);
            $table->timestamps();

            $table->index(['status', 'category_id']);
            $table->index('created_at');
        });

        Schema::create('ad_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_images');
        Schema::dropIfExists('ads');
    }
};
