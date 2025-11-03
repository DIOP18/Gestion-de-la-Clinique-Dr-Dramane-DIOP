<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SpecialtySeeder::class,
            TestUsersSeeder::class,
        ]);

        // Create a default admin if not exists
        if (!User::where('email', 'admin@clinique.test')->exists()) {
            User::create([
                'name' => 'Admin Clinic',
                'first_name' => 'Admin',
                'last_name' => 'Clinic',
                'email' => 'admin@clinique.test',
                'phone' => '+221700000000',
                'address' => 'Siège clinique',
                'image' => 'users/admin.jpg',
                'description' => 'Administrateur par défaut',
                'gender' => 'O',
                'password' => 'admin123456',
                'role' => 'ADMINISTRATEUR',
            ]);
        }
    }
}
