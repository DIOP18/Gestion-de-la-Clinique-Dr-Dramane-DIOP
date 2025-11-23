<?php

use App\Http\Controllers\AssistantController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\SpecialtyController;
use App\Http\Controllers\VisitorAppointmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DisponibiliteController;
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


Route::middleware(['auth:sanctum', 'check.blocked'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
// Récupérer les spécialités (pour le formulaire médecin)

// Dans routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'me']);
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/update-avatar', [ProfileController::class, 'updateAvatar']);
    Route::post('/profile/update-password', [ProfileController::class, 'updatePassword']);
});
Route::get('/availability/{availabilityId}/check', [VisitorAppointmentController::class, 'checkAvailability']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/verify', [VisitorAppointmentController::class, 'verifyAuth']);
    Route::post('/visitor/appointments', [VisitorAppointmentController::class, 'createFromVisitor']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::get('/public/doctors', [PublicController::class, 'listDoctors']);
Route::get('/public/doctors/{doctor}/availabilities', [PublicController::class, 'doctorAvailabilities']);
Route::get('/specialties', [SpecialtyController::class, 'index']);
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/search', [DoctorController::class, 'search']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);
Route::get('/doctors/{doctorId}/disponibilites', [DisponibiliteController::class, 'getByDoctor']);

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// 2FA (auth required)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/2fa/enable', [TwoFactorController::class, 'enable']);
    Route::post('/2fa/verify', [TwoFactorController::class, 'verify']);
    Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);
});

// Protected endpoints (stubs to be implemented)
Route::middleware(['auth:sanctum', 'check.blocked','role:ADMINISTRATEUR'])->group(function () {
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

Route::middleware(['auth:sanctum', 'check.blocked','role:MEDECIN'])->group(function () {
    // Médecin: disponibilités CRUD
    Route::get('/medecin/disponibilites', [DisponibiliteController::class, 'index']);
    Route::post('/medecin/disponibilites', [DisponibiliteController::class, 'store']);
    Route::put('/medecin/disponibilites/{disponibilite}', [DisponibiliteController::class, 'update']);
    Route::delete('/medecin/disponibilites/{disponibilite}', [DisponibiliteController::class, 'destroy']);
    Route::get('/appointments', [DoctorController::class, 'getAppointments']);
    Route::put('/appointments/{id}/confirm', [DoctorController::class, 'confirmAppointment']);
    Route::put('/appointments/{id}/cancel', [DoctorController::class, 'cancelAppointment']);


    // Médecin: statistiques personnelles
    Route::get('/medecin/stats', [StatsController::class, 'doctor']);
});

Route::middleware(['auth:sanctum','check.blocked', 'role:ASSISTANT'])->group(function () {
    Route::get('/assistant/specialite', [SpecialtyController::class, 'specialitesIndexass']);
    Route::get('/assistant/global-view', [AssistantController::class, 'globalView']);
    // Assistant: créer rendez-vous pour un patient, lister ceux qu'il programme
    Route::post('/assistant/rendez-vous', [RendezVousController::class, 'assistantCreate']);
    // Assistant: statistiques de ses rendez-vous
    Route::get('/assistant/stats', [StatsController::class, 'assistant']);

});

Route::middleware(['auth:sanctum', 'role:PATIENT'])->group(function () {
    Route::post('/patient/rendez-vous', [RendezVousController::class, 'patientCreate']);
    Route::get('/patient/appointments', [RendezVousController::class, 'getAppointments']);
    Route::put('/patient/appointments/{id}/cancel', [RendezVousController::class, 'cancelAppointment']);
    Route::post('/patient/appointments/{id}/create-payment-intent', [RendezVousController::class, 'createPaymentIntent']);
    Route::post('/patient/appointments/{id}/confirm-payment', [RendezVousController::class, 'confirmPayment']);
    Route::post('/patient/appointments/{id}/pay', [RendezVousController::class, 'payAppointment']);
});


