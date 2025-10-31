<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normalize existing nulls to safe defaults before altering to NOT NULL
        DB::table('users')->whereNull('first_name')->update(['first_name' => '']);
        DB::table('users')->whereNull('last_name')->update(['last_name' => '']);
        DB::table('users')->whereNull('phone')->update(['phone' => '']);
        DB::table('users')->whereNull('address')->update(['address' => '']);
        DB::table('users')->whereNull('image')->update(['image' => '']);
        DB::table('users')->whereNull('description')->update(['description' => '']);
        DB::table('users')->whereNull('gender')->update(['gender' => 'O']);
        DB::table('users')->whereNull('role')->update(['role' => 'PATIENT']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->default('')->nullable(false)->change();
            $table->string('last_name')->default('')->nullable(false)->change();
            $table->string('phone')->default('')->nullable(false)->change();
            $table->string('address')->default('')->nullable(false)->change();
            $table->string('image')->default('')->nullable(false)->change();
            $table->text('description')->nullable(false)->change();
            $table->enum('gender', ['M', 'F', 'O'])->default('O')->nullable(false)->change();
            $table->enum('role', ['ADMINISTRATEUR', 'MEDECIN', 'ASSISTANT', 'PATIENT'])->default('PATIENT')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->default(null)->change();
            $table->string('last_name')->nullable()->default(null)->change();
            $table->string('phone')->nullable()->default(null)->change();
            $table->string('address')->nullable()->default(null)->change();
            $table->string('image')->nullable()->default(null)->change();
            $table->text('description')->nullable()->change();
            $table->enum('gender', ['M', 'F', 'O'])->nullable()->default(null)->change();
            $table->enum('role', ['ADMINISTRATEUR', 'MEDECIN', 'ASSISTANT', 'PATIENT'])->default('PATIENT')->nullable()->change();
        });
    }
};


