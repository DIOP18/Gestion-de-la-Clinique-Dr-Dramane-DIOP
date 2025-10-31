<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('phone')->nullable()->after('last_name');
            $table->string('address')->nullable()->after('phone');
            $table->string('image')->nullable()->after('address');
            $table->text('description')->nullable()->after('image');
            $table->enum('gender', ['M', 'F', 'O'])->nullable()->after('description');
            $table->enum('role', ['ADMINISTRATEUR', 'MEDECIN', 'ASSISTANT', 'PATIENT'])->default('PATIENT')->after('gender');

            // 2FA scaffolding (compatible with Laravel Fortify style columns)
            $table->text('two_factor_secret')->nullable()->after('remember_token');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name', 'last_name', 'phone', 'address', 'image', 'description', 'gender', 'role',
                'two_factor_secret', 'two_factor_recovery_codes'
            ]);
        });
    }
};


