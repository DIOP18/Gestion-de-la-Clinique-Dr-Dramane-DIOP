<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'num_patient',
        'medical_history',
        'blood_group',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function doctors(): BelongsToMany
    {
        return $this->belongsToMany(Doctor::class, 'rendez_vous', 'patient_id', 'doctor_id')->withTimestamps();
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
    protected static function boot()
    {
        parent::boot();

        // Événement déclenché AVANT la création en base
        static::creating(function ($patient) {
            if (empty($patient->num_patient)) {
                $patient->num_patient = self::generateNumPatient();
            }
        });
    }


    private static function generateNumPatient(): string
    {
        // Récupérer le dernier patient créé
        $lastPatient = self::orderBy('id', 'desc')->first();

        if (!$lastPatient) {
            // Premier patient
            return 'PAT-00001';
        }

        // Extraire le numéro du dernier num_patient (ex: PAT-00005 → 5)
        $lastNumber = (int) substr($lastPatient->num_patient, 4);

        // Incrémenter et formater
        $newNumber = $lastNumber + 1;

        return 'PAT-' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}


