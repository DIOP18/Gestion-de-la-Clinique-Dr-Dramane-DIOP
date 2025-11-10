<?php

namespace Database\Seeders;

use App\Models\Assistant;
use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $specialty = Specialty::first() ?? Specialty::create(['label' => 'Généraliste']);

        // Doctor user
        if (!User::where('email', 'medecin@clinique.test')->exists()) {
            $u = User::create([
                'first_name' => 'SODA',
                'last_name' => 'DIOP',
                'name' => 'Soda DIOP',
                'email' => 'medecin@clinique.test',
                'phone' => '+221711111111',
                'address' => 'Cabinet A',
                'image' => 'users/imagemedical.png',
                'gender' => 'M',
                'password' => Hash::make('password123'),
                'role' => 'MEDECIN',
            ]);

            Doctor::create([
                'user_id' => $u->id,
                'num_ordre' => 'ORD-000001',
                'specialty_id' => $specialty->id,
                'description' => 'Médecin test',
            ]);
        }

        // Assistant user
        if (!User::where('email', 'assistant@clinique.test')->exists()) {
            $u = User::create([
                'first_name' => 'Anna',
                'last_name' => 'Assistant',
                'name' => 'Anna Assistant',
                'email' => 'assistant@clinique.test',
                'phone' => '+221722222222',
                'address' => 'Accueil',
                'image' => 'users/assistant.png',
                'gender' => 'F',
                'password' => Hash::make('password123'),
                'role' => 'ASSISTANT',
            ]);

            Assistant::create([
                'user_id' => $u->id,
                'num_employe' => 'EMP-000001',
            ]);
        }
    }
}
