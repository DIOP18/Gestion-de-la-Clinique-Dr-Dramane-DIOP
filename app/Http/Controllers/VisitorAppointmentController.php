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
     * Vérifie que l'utilisateur est authentifié et retourne ses infos
     */
    public function verifyAuth(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'authenticated' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => Auth::id(),
                'name' => Auth::user()->nom . ' ' . Auth::user()->prenom,
                'email' => Auth::user()->email,
                'role' => Auth::user()->role
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
            return response()->json([
                'error' => 'Authentification requise',
                'message' => 'Vous devez être connecté pour prendre un rendez-vous'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'availability_id' => ['required', 'exists:disponibilites,id'],
            'motif' => ['required', 'string', 'max:500'],
        ], [
            'availability_id.required' => 'Le créneau est requis',
            'availability_id.exists' => 'Le créneau sélectionné n\'existe pas',
            'motif.required' => 'Le motif de consultation est requis',
            'motif.max' => 'Le motif ne doit pas dépasser 500 caractères'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Récupérer la disponibilité avec lock pour éviter les conflits
            $availability = Availability::with('appointment')->lockForUpdate()->find($request->availability_id);

            // Vérifier que le créneau est toujours disponible
            if ($availability->appointment) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Ce créneau n\'est plus disponible',
                    'message' => 'Un autre patient a réservé ce créneau entre temps'
                ], 409);
            }

            // Récupérer l'utilisateur connecté
            $user = Auth::user();

            // Créer ou récupérer le patient associé
            $patient = Patient::firstOrCreate(
                ['user_id' => $user->id],
                [
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
                'cree_par_type' => 'PATIENT',
                'cree_par_user_id' => $user->id,
                'prix' => $prix,
                'paye_par' => null,
            ]);

            DB::commit();

            // Charger les relations pour la réponse
            $appointment->load(['doctor.user', 'doctor.specialty', 'patient.user']);

            return response()->json([
                'success' => true,
                'message' => 'Rendez-vous créé avec succès',
                'appointment' => [
                    'id' => $appointment->id,
                    'date' => $appointment->debut_at->format('Y-m-d'),
                    'heure_debut' => $appointment->debut_at->format('H:i'),
                    'heure_fin' => $appointment->fin_at->format('H:i'),
                    'statut' => $appointment->statut,
                    'motif' => $appointment->motif,
                    'prix' => $appointment->prix,
                    'doctor' => [
                        'nom_complet' => $appointment->doctor->user->last_name . ' ' . $appointment->doctor->user->first_name,
                        'specialite' => $appointment->doctor->specialty->label ?? 'N/A'
                    ],
                    'patient' => [
                        'nom_complet' => $appointment->patient->user->last_name . ' ' . $appointment->patient->user->first_name
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Erreur création RDV visiteur: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'availability_id' => $request->availability_id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la création du rendez-vous',
                'message' => 'Une erreur s\'est produite. Veuillez réessayer.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
