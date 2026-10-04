<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class District extends Model
{
    public $timestamps = false;

    protected $fillable = ['division_id', 'name'];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
