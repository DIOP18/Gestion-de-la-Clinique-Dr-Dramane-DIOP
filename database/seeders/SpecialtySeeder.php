<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            ['label' => 'Généraliste', 'prix' => 10000],
            ['label' => 'Cardiologie', 'prix' => 15000],
            ['label' => 'Dermatologie', 'prix' => 12000],
            ['label' => 'Pédiatrie', 'prix' => 13000],
            ['label' => 'Gynécologie', 'prix' => 14000],
            ['label' => 'Neurologie', 'prix' => 16000],
            ['label' => 'Ophtalmologie', 'prix' => 11000],
        ];

        foreach ($specialties as $data) {
            Specialty::updateOrCreate(
                ['label' => $data['label']],
                ['prix' => $data['prix']]
            );
        }
    }
}
