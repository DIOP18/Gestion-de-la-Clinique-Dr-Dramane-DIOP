<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->integer('nombre_reprogrammations')->default(0)->after('statut');
            $table->timestamp('derniere_reprogrammation_at')->nullable()->after('nombre_reprogrammations');
            $table->enum('reprogramme_par_type', ['MEDECIN', 'ASSISTANT'])->nullable()->after('derniere_reprogrammation_at');
            $table->unsignedBigInteger('reprogramme_par_user_id')->nullable()->after('reprogramme_par_type');
            $table->text('raison_reprogrammation')->nullable()->after('reprogramme_par_user_id');

            $table->foreign('reprogramme_par_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->dropForeign(['reprogramme_par_user_id']);
            $table->dropColumn([
                'nombre_reprogrammations',
                'derniere_reprogrammation_at',
                'reprogramme_par_type',
                'reprogramme_par_user_id',
                'raison_reprogrammation'
            ]);
        });
    }
};
