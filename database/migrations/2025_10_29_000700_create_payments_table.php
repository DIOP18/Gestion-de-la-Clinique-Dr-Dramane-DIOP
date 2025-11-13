<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rendez_vous_id')->constrained('rendez_vous')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 8)->default('XOF');
            $table->string('provider')->default('PAYDUNYA');
            $table->enum('status', ['IMPAYE', 'EN ATTENTE', 'PAYE'])->default('IMPAYE');
            $table->string('external_reference')->nullable();
            $table->json('provider_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};


