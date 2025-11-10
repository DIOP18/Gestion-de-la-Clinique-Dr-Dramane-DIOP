<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Availability;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class VisitorAppointmentController extends Controller
{
    /**
     * Vérifie la disponibilité d'un créneau
     */
    public function checkAvailability($availabilityId)
    {
        $availability = Availability::with('appointment')->find($availabilityId);

        if (!$availability) {
            return response()->json(['error' => 'Créneau introuvable'], 404);
        }

        $isAvailable = !$availability->appointment;

        return response()->json([
            'available' => $isAvailable,
            'availability' => [
                'id' => $availability->id,
                'date' => $availability->date->format('Y-m-d'),
                'heure_debut' => $availability->heure_debut,
                'heure_fin' => $availability->heure_fin,
                'doctor_id' => $availability->doctor_id
            ]
        ]);
    }

    /**
     * Création de RDV par un visiteur (nécessite authentification)
     */
    public function createFromVisitor(Request $request)
    {
        // Vérifier que l'utilisateur est authentifié
        if (!Auth::check()) {
            return response()->json(['error' => 'Authentification requise'], 401);
        }

        $validator = Validator::make($request->all(), [
            'availability_id' => ['required', 'exists:disponibilites,id'],
            'motif' => ['required', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Récupérer la disponibilité avec lock
            $availability = Availability::with('appointment')->lockForUpdate()->find($request->availability_id);

            // Vérifier que le créneau est toujours disponible
            if ($availability->appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Ce créneau n\'est plus disponible'], 409);
            }

            // Récupérer l'utilisateur connecté
            $user = Auth::user();

            $patient = Patient::firstOrCreate(
                ['user_id' => $user->id],
                [
                    // num_patient sera généré automatiquement par le boot() du model
                    'medical_history' => null,
                    'blood_group' => null,
                ]
            );

            // Récupérer le docteur et son prix
            $doctor = Doctor::with('specialty')->findOrFail($availability->doctor_id);
            $prix = $doctor->specialty->prix ?? 0;

            // Créer le rendez-vous
            $appointment = Appointment::create([
                'doctor_id' => $availability->doctor_id,
                'patient_id' => $patient->id,
                'assistant_id' => null,
                'availability_id' => $availability->id,
                'debut_at' => Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->heure_debut),
                'fin_at' => Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->heure_fin),
                'statut' => 'EN ATTENTE',
                'motif' => $request->motif,
                'cree_par_type' => null, // Ni PATIENT ni ASSISTANT = VISITEUR
                'cree_par_user_id' => $user->id,
                'prix' => $prix,
                'paye_par' => null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Rendez-vous créé avec succès',
                'appointment' => $appointment->load('doctor.specialty', 'patient'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors de la création du rendez-vous',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
