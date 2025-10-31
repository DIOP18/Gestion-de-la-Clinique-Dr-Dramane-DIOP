<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DisponibiliteController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\TwoFactorController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public endpoints (visitors can browse available doctors and slots)
Route::get('/public/doctors', [PublicController::class, 'listDoctors']);
Route::get('/public/doctors/{doctor}/availabilities', [PublicController::class, 'doctorAvailabilities']);

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// 2FA (auth required)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/2fa/enable', [TwoFactorController::class, 'enable']);
    Route::post('/2fa/verify', [TwoFactorController::class, 'verify']);
    Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);
});

// Protected endpoints (stubs to be implemented)
Route::middleware(['auth:sanctum', 'role:ADMINISTRATEUR'])->group(function () {
    // Admin: manage users (CRUD + block)
    Route::get('/users', [AdminController::class, 'usersIndex']);
    Route::get('/users/{user}', [AdminController::class, 'usersShow']);
    Route::post('/users', [AdminController::class, 'usersStore']);
    Route::put('/users/{user}', [AdminController::class, 'usersUpdate']);
    Route::delete('/users/{user}', [AdminController::class, 'usersDestroy']);
    Route::post('/users/{user}/block', [AdminController::class, 'usersBlock']);
    Route::post('/users/{user}/unblock', [AdminController::class, 'usersUnblock']);

    // Admin: specialties CRUD
    Route::get('/specialites', [AdminController::class, 'specialitesIndex']);
    Route::post('/specialites', [AdminController::class, 'specialitesStore']);
    Route::put('/specialites/{specialty}', [AdminController::class, 'specialitesUpdate']);
    Route::delete('/specialites/{specialty}', [AdminController::class, 'specialitesDestroy']);

    // Admin: créer/lister médecins
    Route::get('/medecins', [AdminController::class, 'medecinsIndex']);
    Route::post('/medecins', [AdminController::class, 'medecinsStore']);

    // Admin: créer/lister assistants
    Route::get('/assistants', [AdminController::class, 'assistantsIndex']);
    Route::post('/assistants', [AdminController::class, 'assistantsStore']);
    // Admin: statistiques globales
    Route::get('/stats', [StatsController::class, 'admin']);
});

Route::middleware(['auth:sanctum', 'role:MEDECIN'])->group(function () {
    // Médecin: disponibilités CRUD
    Route::get('/medecin/disponibilites', [DisponibiliteController::class, 'index']);
    Route::post('/medecin/disponibilites', [DisponibiliteController::class, 'store']);
    Route::put('/medecin/disponibilites/{disponibilite}', [DisponibiliteController::class, 'update']);
    Route::delete('/medecin/disponibilites/{disponibilite}', [DisponibiliteController::class, 'destroy']);

    // Médecin: lister ses rendez-vous
    Route::get('/medecin/rendez-vous', [RendezVousController::class, 'listForDoctor']);

    // Médecin: actions statut
    Route::post('/rendez-vous/{rendez_vou}/confirmer', [RendezVousController::class, 'updateStatutConfirm']);
    Route::post('/rendez-vous/{rendez_vou}/annuler', [RendezVousController::class, 'updateStatutCancel']);
    Route::post('/rendez-vous/{rendez_vou}/terminer', [RendezVousController::class, 'updateStatutComplete']);
    Route::post('/rendez-vous/{rendez_vou}/reporter', [RendezVousController::class, 'reschedule']);
    // Médecin: statistiques personnelles
    Route::get('/medecin/stats', [StatsController::class, 'doctor']);
});

Route::middleware(['auth:sanctum', 'role:ASSISTANT'])->group(function () {
    // Assistant: créer rendez-vous pour un patient, lister ceux qu'il programme
    Route::post('/assistant/rendez-vous', [RendezVousController::class, 'assistantCreate']);
    Route::get('/assistant/rendez-vous', [RendezVousController::class, 'listForAssistant']);
    Route::post('/rendez-vous/{rendez_vou}/annuler', [RendezVousController::class, 'updateStatutCancel']);
    Route::post('/rendez-vous/{rendez_vou}/reporter', [RendezVousController::class, 'reschedule']);
    // Assistant: statistiques de ses rendez-vous
    Route::get('/assistant/stats', [StatsController::class, 'assistant']);
});

Route::middleware(['auth:sanctum', 'role:PATIENT'])->group(function () {
    // Patient: créer/lister/annuler/reporter ses rendez-vous
    Route::post('/patient/rendez-vous', [RendezVousController::class, 'patientCreate']);
    Route::get('/patient/rendez-vous', [RendezVousController::class, 'listForPatient']);
    Route::post('/rendez-vous/{rendez_vou}/annuler', [RendezVousController::class, 'updateStatutCancel']);
    Route::post('/rendez-vous/{rendez_vou}/reporter', [RendezVousController::class, 'reschedule']);
});
