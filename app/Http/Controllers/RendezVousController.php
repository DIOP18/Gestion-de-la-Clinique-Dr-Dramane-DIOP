<?php

namespace App\Http\Controllers;

use App\Models\Appointment;

use App\Models\Availability;
use App\Models\Doctor;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;


class RendezVousController extends Controller
{
    public function patientCreate(Request $request) {

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
                'cree_par_type' => 'PATIENT',
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
    /**
     * Création d’un rendez-vous par un assistant
     */
    public function assistantCreate(Request $request)
    {
        $data = $request->all();

        $validator = Validator::make($data, [
            'doctor_id' => ['required', 'exists:doctors,id'],
            'patient_id' => ['required', 'exists:patients,id'],
            'debut_at' => ['required', 'date'],
            'fin_at' => ['required', 'date', 'after:debut_at'],
            'motif' => ['nullable', 'string'],
            'availability_id' => ['nullable', 'exists:disponibilites,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $doctor = Doctor::with('specialty')->findOrFail($data['doctor_id']);
        $prix = $doctor->specialty->prix ?? 0;

        $rdv = Appointment::create([
            'doctor_id' => $data['doctor_id'],
            'patient_id' => $data['patient_id'],
            'assistant_id' => $request->user()->id,
            'availability_id' => $data['availability_id'] ?? null,
            'debut_at' => $data['debut_at'],
            'fin_at' => $data['fin_at'],
            'statut' => 'EN ATTENTE',
            'motif' => $data['motif'] ?? null,
            'cree_par_type' => 'ASSISTANT',
            'cree_par_user_id' => $request->user()->id,
            'prix' => $prix,
        ]);

        return response()->json([
            'message' => 'Rendez-vous créé avec succès par l’assistant',
            'rendez_vous' => $rdv,
        ]);
    }

    /**
     * Liste des rendez-vous d’un patient
     */

}


