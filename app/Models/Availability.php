<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Availability extends Model
{
    use HasFactory;

    protected $table = 'disponibilites';

    protected $fillable = [
        'doctor_id',
        'date',
        'heure_debut',
        'heure_fin',
        'duree_consultation_minutes',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }


    public function appointment(): HasOne
    {
        return $this->hasOne(Appointment::class, 'availability_id');
    }
    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}


