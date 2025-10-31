<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $labels = [
            'Généraliste', 'Cardiologie', 'Dermatologie', 'Pédiatrie', 'Gynécologie', 'Neurologie', 'Ophtalmologie'
        ];
        foreach ($labels as $label) {
            Specialty::firstOrCreate(['label' => $label]);
        }
    }
}


