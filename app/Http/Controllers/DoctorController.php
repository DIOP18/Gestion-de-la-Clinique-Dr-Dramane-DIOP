<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Availability;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DoctorController extends Controller
{
    /**
     * Récupérer tous les médecins avec leur spécialité et prix
     */
    public function index()
    {
        $doctors = Doctor::with(['specialty:id,label,prix', 'user:id,first_name,last_name'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'nom_complet' => $doctor->user->first_name . ' ' . $doctor->user->last_name,
                    'email' => $doctor->user->email,
                    'telephone' => $doctor->user->phone,
                    'description' => $doctor->description,
                    'specialite' => $doctor->specialty->label ?? null,
                    'prix_consultation' => $doctor->specialty->prix ?? 0,
                ];
            });

        return response()->json($doctors);
    }

    /**
     * Rechercher les médecins par spécialité
     */
    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json(['error' => 'Query parameter is required'], 400);
        }

        $doctors = Doctor::with(['specialty:id,label,prix', 'user:id,first_name,last_name,email,phone'])
            ->whereHas('specialty', function ($q) use ($query) {
                $q->where('label', 'like', "%$query%");
            })
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'nom_complet' => $doctor->user->first_name . ' ' . $doctor->user->last_name,
                    'email' => $doctor->user->email,
                    'telephone' => $doctor->user->phone,
                    'specialite' => $doctor->specialty->label ?? null,
                    'prix_consultation' => $doctor->specialty->prix ?? 0,
                    'description' => $doctor->description,
                ];
            });

        return response()->json($doctors);
    }
    /**
     * Récupérer les détails d'un médecin spécifique
     */
    public function show($id)
    {
        $doctor = Doctor::with(['specialty:id,label,prix', 'user:id,first_name,last_name,email,phone'])
            ->findOrFail($id);

        return response()->json([
            'id' => $doctor->id,
            'nom_complet' => $doctor->user->first_name . ' ' . $doctor->user->last_name,
            'email' => $doctor->user->email,
            'telephone' => $doctor->user->phone,
            'specialite' => $doctor->specialty->label ?? null,
            'prix_consultation' => $doctor->specialty->prix ?? 0,
            'description' => $doctor->description,
        ]);
    }
    /**
     * Liste des rendez-vous du docteur connecté
     */
    public function getAppointments(Request $request)
    {
        try {
            $user = Auth::user();

            // Récupérer le docteur connecté
            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['error' => 'Docteur non trouvé'], 404);
            }

            // Récupérer les rendez-vous avec relations
            $appointments = Appointment::with([
                'patient.user',
                'availability',
                'doctor.specialty'
            ])
                ->where('doctor_id', $doctor->id)
                ->orderBy('debut_at', 'asc')
                ->get()
                ->map(function($appointment) {
                    return [
                        'id' => $appointment->id,
                        'patient_nom' => $appointment->patient->user->last_name ?? 'N/A',
                        'patient_prenom' => $appointment->patient->user->first_name ?? 'N/A',
                        'patient_full_name' => ($appointment->patient->user->first_name ?? '') . ' ' . ($appointment->patient->user->last_name ?? ''),
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
                        'cree_par_type' => $appointment->cree_par_type,
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
     * Confirmer un rendez-vous
     */
    public function confirmAppointment($id)
    {
        try {
            $user = Auth::user();
            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['error' => 'Docteur non trouvé'], 404);
            }

            $appointment = Appointment::where('id', $id)
                ->where('doctor_id', $doctor->id)
                ->first();

            if (!$appointment) {
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            if ($appointment->statut === 'ANNULE') {
                return response()->json(['error' => 'Impossible de confirmer un rendez-vous annulé'], 400);
            }

            $appointment->update(['statut' => 'CONFIRME']);

            return response()->json([
                'message' => 'Rendez-vous confirmé avec succès',
                'appointment' => $appointment->load('patient.user')
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la confirmation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler un rendez-vous
     */
    public function cancelAppointment($id)
    {
        try {
            $user = Auth::user();
            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['error' => 'Docteur non trouvé'], 404);
            }

            DB::beginTransaction();

            $appointment = Appointment::where('id', $id)
                ->where('doctor_id', $doctor->id)
                ->first();

            if (!$appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            // Libérer la disponibilité si elle existe
            if ($appointment->availability_id) {
                $availability = Availability::find($appointment->availability_id);
                if ($availability) {
                    // La disponibilité redevient disponible
                    $appointment->availability_id = null;
                }
            }

            $appointment->update(['statut' => 'ANNULE']);

            DB::commit();

            return response()->json([
                'message' => 'Rendez-vous annulé avec succès',
                'appointment' => $appointment->load('patient.user')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors de l\'annulation',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
