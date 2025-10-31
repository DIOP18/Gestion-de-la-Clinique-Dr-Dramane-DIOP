<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'assistant_id',
        'availability_id',
        'debut_at',
        'fin_at',
        'statut',
        'motif',
        'cree_par_type',
        'cree_par_user_id',
        'note_medecin',
        'prix',
        'paye_par',
    ];

    protected $casts = [
        'debut_at' => 'datetime',
        'fin_at' => 'datetime',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function assistant(): BelongsTo
    {
        return $this->belongsTo(Assistant::class);
    }

    public function availability(): BelongsTo
    {
        return $this->belongsTo(Availability::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'rendez_vous_id');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'rendez_vous_id');
    }
}


