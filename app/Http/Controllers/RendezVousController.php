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

    public function getAppointments(Request $request)
    {
        try {
            $user = Auth::user();

            // Récupérer le patient connecté
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            // Récupérer les rendez-vous avec relations
            $appointments = Appointment::with([
                'doctor.user',
                'doctor.specialty',
                'availability'
            ])
                ->where('patient_id', $patient->id)
                ->orderBy('debut_at', 'desc')
                ->get()
                ->map(function($appointment) {
                    return [
                        'id' => $appointment->id,
                        'doctor_nom' => $appointment->doctor->user->last_name ?? 'N/A',
                        'doctor_prenom' => $appointment->doctor->user->first_name ?? 'N/A',
                        'doctor_full_name' => ($appointment->doctor->user->first_name ?? '') . ' ' . ($appointment->doctor->user->last_name ?? ''),
                        'specialty' => $appointment->doctor->specialty->label ?? 'N/A',
                        'debut_at' => $appointment->debut_at,
                        'fin_at' => $appointment->fin_at,
                        'heure_debut' => Carbon::parse($appointment->debut_at)->format('H:i'),
                        'heure_fin' => Carbon::parse($appointment->fin_at)->format('H:i'),
                        'date' => Carbon::parse($appointment->debut_at)->format('d/m/Y'),
                        'statut' => $appointment->statut,
                        'motif' => $appointment->motif,
                        'est_paye' => $appointment->est_paye,
                        'prix' => $appointment->prix,
                        'paye_par' => $appointment->paye_par,
                        'note_medecin' => $appointment->note_medecin,
                    ];
                });

            return response()->json([
                'appointments' => $appointments
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la récupération des rendez-vous',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler un rendez-vous (seulement si EN ATTENTE)
     */
    public function cancelAppointment($id)
    {
        try {
            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            DB::beginTransaction();

            $appointment = Appointment::where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            // Vérifier que le rendez-vous est EN ATTENTE
            if ($appointment->statut !== 'EN ATTENTE') {
                DB::rollBack();
                return response()->json([
                    'error' => 'Vous ne pouvez annuler que les rendez-vous en attente'
                ], 400);
            }

            // Libérer la disponibilité
            if ($appointment->availability_id) {
                $appointment->availability_id = null;
            }

            $appointment->update(['statut' => 'ANNULE']);

            DB::commit();

            return response()->json([
                'message' => 'Rendez-vous annulé avec succès',
                'appointment' => $appointment->load('doctor.user', 'doctor.specialty')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors de l\'annulation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Payer un rendez-vous (seulement si CONFIRME)
     */
    public function payAppointment(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            DB::beginTransaction();

            $appointment = Appointment::where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            // Vérifier que le rendez-vous est CONFIRME
            if ($appointment->statut !== 'CONFIRME') {
                DB::rollBack();
                return response()->json([
                    'error' => 'Vous ne pouvez payer que les rendez-vous confirmés'
                ], 400);
            }

            // Vérifier qu'il n'est pas déjà payé
            if ($appointment->est_paye) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Ce rendez-vous est déjà payé'
                ], 400);
            }

            // Valider la méthode de paiement
            $validator = \Validator::make($request->all(), [
                'paye_par' => ['required', 'string', 'in:ESPECES,CARTE,MOBILE_MONEY,VIREMENT']
            ]);

            if ($validator->fails()) {
                DB::rollBack();
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Marquer comme payé
            $appointment->update([
                'est_paye' => true,
                'paye_par' => $request->paye_par
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Paiement effectué avec succès',
                'appointment' => $appointment->load('doctor.user', 'doctor.specialty')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors du paiement',
                'details' => $e->getMessage()
            ], 500);
        }
    }

}


