<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'rendez_vous_id',
        'amount',
        'currency',
        'provider',
        'status',
        'external_reference',
        'provider_response',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'provider_response' => 'array',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'rendez_vous_id');
    }
    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

}


