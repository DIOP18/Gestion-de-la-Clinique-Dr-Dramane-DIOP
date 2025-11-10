<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('assistant_id')->nullable()->constrained('assistants');
            $table->foreignId('availability_id')->nullable()->unique()->constrained('disponibilites')->nullOnDelete();

            $table->dateTime('debut_at');
            $table->dateTime('fin_at');

            $table->enum('statut', ['EN ATTENTE', 'CONFIRME', 'COMPLETE', 'ANNULE', 'REPORT'])->default('EN ATTENTE');
            $table->string('motif')->nullable();
            $table->string('cree_par_type')->nullable(); // 'PATIENT' ou 'ASSISTANT'
            $table->foreignId('cree_par_user_id')->nullable()->constrained('users');
            $table->text('note_medecin')->nullable();
            $table->decimal('prix', 10, 2)->default(0);
            $table->string('paye_par')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous'); // Corriger ici
    }
};


