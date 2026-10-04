<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// key-value সাইট সেটিংস (হিরো টেক্সট, যোগাযোগ, অটো-অ্যাপ্রুভ ইত্যাদি)
class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, $default = null)
    {
        $row = static::where('key', $key)->first();

        return $row ? $row->value : $default;
    }

    public static function put(string $key, $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
