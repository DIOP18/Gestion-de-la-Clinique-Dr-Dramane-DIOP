<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Availability;
use App\Models\Doctor;
use App\Notifications\AppointmentRescheduled;
use App\Notifications\AppointmentRescheduleDoctor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AssistantController extends Controller
{
    /**
     * Vue globale pour l'assistant : disponibilités + rendez-vous confirmés
     * Route : GET /api/assistant/global-view
     */
    public function globalView(Request $request)
    {
        try {
            $user = Auth::user();

            // Vérifier que l'utilisateur est bien un assistant
            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $today = Carbon::today();

            // ========== DISPONIBILITÉS ==========
            // Récupérer toutes les disponibilités >= aujourd'hui
            $disponibilites = Availability::with([
                'doctor.user',
                'doctor.specialty'
            ])
                ->whereDate('date', '>=', $today)
                ->whereDoesntHave('appointment') // Uniquement les dispos sans RDV
                ->orderBy('date', 'asc')
                ->orderBy('heure_debut', 'asc')
                ->get()
                ->map(function ($dispo) {
                    return [
                        'id' => $dispo->id,
                        'doctor_id' => $dispo->doctor_id,
                        'doctor_name' => 'Dr. ' . ($dispo->doctor->user->first_name ?? '') . ' ' . ($dispo->doctor->user->last_name ?? ''),
                        'specialty' => $dispo->doctor->specialty->label ?? 'N/A',
                        'specialty_id' => $dispo->doctor->specialty_id,
                        'date' => Carbon::parse($dispo->date)->format('d/m/Y'),
                        'date_iso' => Carbon::parse($dispo->date)->format('Y-m-d'),
                        'heure_debut' => Carbon::parse($dispo->heure_debut)->format('H:i'),
                        'heure_fin' => Carbon::parse($dispo->heure_fin)->format('H:i'),
                        'duree_consultation' => $dispo->duree_consultation_minutes,
                    ];
                });

            // ========== RENDEZ-VOUS CONFIRMÉS ET REPROGRAMMÉS ==========
            // Récupérer tous les RDV confirmés et reprogrammés >= aujourd'hui
            $rendezVous = Appointment::with([
                'doctor.user',
                'doctor.specialty',
                'patient.user'
            ])
                ->whereIn('statut', ['CONFIRME', 'REPORT'])
                ->where('debut_at', '>=', Carbon::now())
                ->orderBy('debut_at', 'asc')
                ->get()
                ->map(function ($rdv) {
                    return [
                        'id' => $rdv->id,
                        'doctor_id' => $rdv->doctor_id,
                        'doctor_name' => 'Dr. ' . ($rdv->doctor->user->first_name ?? '') . ' ' . ($rdv->doctor->user->last_name ?? ''),
                        'specialty' => $rdv->doctor->specialty->label ?? 'N/A',
                        'specialty_id' => $rdv->doctor->specialty_id,
                        'patient_id' => $rdv->patient_id,
                        'patient_name' => ($rdv->patient->user->first_name ?? '') . ' ' . ($rdv->patient->user->last_name ?? ''),
                        'patient_phone' => $rdv->patient->user->phone ?? 'N/A',
                        'date' => Carbon::parse($rdv->debut_at)->format('d/m/Y'),
                        'date_iso' => Carbon::parse($rdv->debut_at)->format('Y-m-d'),
                        'heure_debut' => Carbon::parse($rdv->debut_at)->format('H:i'),
                        'heure_fin' => Carbon::parse($rdv->fin_at)->format('H:i'),
                        'motif' => $rdv->motif ?? 'Non spécifié',
                        'statut' => $rdv->statut,
                        'statut_label' => $rdv->statut === 'REPORT' ? 'Reprogrammé' : 'Confirmé',
                        'est_paye' => $rdv->est_paye,
                        'prix' => $rdv->prix,
                        'paye_par' => $rdv->paye_par ?? 'N/A',
                        'note_medecin' => $rdv->note_medecin,
                        'cree_par_type' => $rdv->cree_par_type,
                    ];
                });

            return response()->json([
                'availability' => $disponibilites,
                'appointment' => $rendezVous,
                'stats' => [
                    'total_disponibilites' => $disponibilites->count(),
                    'total_rendez_vous' => $rendezVous->count(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la récupération des données',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getAvailabilitiesForReschedule(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            // Filtres optionnels
            $doctorId = $request->query('doctor_id');
            $specialtyId = $request->query('specialty_id');
            $startDate = $request->query('start_date', Carbon::today()->format('Y-m-d'));

            $query = Availability::with(['doctor.user', 'doctor.specialty'])
                ->whereDate('date', '>=', $startDate)
                ->whereDoesntHave('appointment'); // Seulement les dispos libres

            if ($doctorId) {
                $query->where('doctor_id', $doctorId);
            }

            if ($specialtyId) {
                $query->whereHas('doctor', function ($q) use ($specialtyId) {
                    $q->where('specialty_id', $specialtyId);
                });
            }

            $availabilities = $query->orderBy('date', 'asc')
                ->orderBy('heure_debut', 'asc')
                ->get()
                ->map(function ($dispo) {
                    return [
                        'id' => $dispo->id,
                        'doctor_id' => $dispo->doctor_id,
                        'doctor_name' => 'Dr. ' . ($dispo->doctor->user->first_name ?? '') . ' ' . ($dispo->doctor->user->last_name ?? ''),
                        'specialty' => $dispo->doctor->specialty->label ?? 'N/A',
                        'specialty_id' => $dispo->doctor->specialty_id,
                        'date' => $dispo->date->format('Y-m-d'),
                        'heure_debut' => Carbon::parse($dispo->heure_debut)->format('H:i'),
                        'heure_fin' => Carbon::parse($dispo->heure_fin)->format('H:i'),
                        'duree_consultation' => $dispo->duree_consultation_minutes,
                        // Format pour FullCalendar
                        'title' => 'Dr. ' . ($dispo->doctor->user->last_name ?? ''),
                        'start' => $dispo->date->format('Y-m-d') . 'T' . Carbon::parse($dispo->heure_debut)->format('H:i:s'),
                        'end' => $dispo->date->format('Y-m-d') . 'T' . Carbon::parse($dispo->heure_fin)->format('H:i:s'),
                        'backgroundColor' => '#10b981',
                        'borderColor' => '#059669',
                    ];
                });

            return response()->json($availabilities, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la récupération des disponibilités',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reprogrammer un rendez-vous (Assistant)
     * Route : POST /api/assistant/appointments/{id}/reschedule
     */
    public function rescheduleAppointment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'new_availability_id' => ['required', 'exists:disponibilites,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = Auth::user();

            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            DB::beginTransaction();

            // Récupérer le RDV avec lock
            $appointment = Appointment::with(['doctor.user', 'doctor.specialty', 'patient.user'])
                ->lockForUpdate()
                ->find($id);

            if (!$appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            // Vérifier que le RDV est reprogrammable (statut CONFIRME uniquement)
            if ($appointment->statut !== 'CONFIRME') {
                DB::rollBack();
                return response()->json([
                    'error' => 'Seuls les rendez-vous confirmés peuvent être reprogrammés'
                ], 400);
            }

            // Récupérer la nouvelle disponibilité
            $newAvailability = Availability::with(['doctor.user', 'doctor.specialty'])
                ->lockForUpdate()
                ->find($request->new_availability_id);

            if (!$newAvailability) {
                DB::rollBack();
                return response()->json(['error' => 'Disponibilité non trouvée'], 404);
            }

            // Vérifier que la nouvelle dispo est libre
            $existingAppointment = Appointment::where('availability_id', $newAvailability->id)->first();
            if ($existingAppointment) {
                DB::rollBack();
                return response()->json(['error' => 'Ce créneau n\'est plus disponible'], 409);
            }

            // Vérifier que c'est au moins 24h avant le RDV actuel
            if ($appointment->debut_at->diffInHours(Carbon::now()) < 24) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Impossible de reprogrammer moins de 24h avant le rendez-vous'
                ], 400);
            }

            // Sauvegarder les anciennes valeurs
            $oldDebutAt = $appointment->debut_at->copy();
            $oldFinAt = $appointment->fin_at->copy();
            $oldAvailabilityId = $appointment->availability_id;
            $oldDoctorId = $appointment->doctor_id;

            // Calculer le nouveau prix si changement de médecin/spécialité
            $newPrice = $appointment->prix;
            if ($newAvailability->doctor_id !== $appointment->doctor_id) {
                $newPrice = $newAvailability->doctor->specialty->prix ?? $appointment->prix;
            }

            // Mettre à jour le rendez-vous
            $appointment->update([
                'doctor_id' => $newAvailability->doctor_id,
                'availability_id' => $newAvailability->id,
                'debut_at' => Carbon::parse($newAvailability->date->format('Y-m-d') . ' ' . $newAvailability->heure_debut),
                'fin_at' => Carbon::parse($newAvailability->date->format('Y-m-d') . ' ' . $newAvailability->heure_fin),
                'statut' => 'REPORT',
                'prix' => $newPrice,
            ]);

            // Vérifier si les champs de reprogrammation existent dans la table avant de les mettre à jour
            try {
                $appointment->update([
                    'nombre_reprogrammations' => ($appointment->nombre_reprogrammations ?? 0) + 1,
                    'derniere_reprogrammation_at' => now(),
                    'reprogramme_par_type' => 'ASSISTANT',
                    'reprogramme_par_user_id' => $user->id,
                    'raison_reprogrammation' => $request->reason,
                ]);
            } catch (\Exception $e) {
                // Si les colonnes n'existent pas, continuer sans erreur
                \Log::warning('Colonnes de reprogrammation non disponibles: ' . $e->getMessage());
            }

            // Recharger les relations
            $appointment->refresh();
            $appointment->load('doctor.user', 'doctor.specialty', 'patient.user');

            // 🔔 NOTIFIER LE PATIENT
            try {
                $appointment->patient->user->notify(
                    new AppointmentRescheduled(
                        $appointment,
                        $oldDebutAt,
                        $oldDebutAt->format('H:i'),
                        $oldFinAt->format('H:i'),
                        "l'assistant",
                        $request->reason
                    )
                );
            } catch (\Exception $e) {
                \Log::error('Erreur notification patient: ' . $e->getMessage());
            }
            try {
                $appointment->doctor->user->notify(
                    new AppointmentRescheduleDoctor(
                        $appointment,
                        $oldDebutAt,
                        $oldDebutAt->format('H:i'),
                        $oldFinAt->format('H:i'),
                        "l'assistant",
                        $request->reason
                    )
                );
            } catch (\Exception $e) {
                \Log::error('Erreur notification médecin : ' . $e->getMessage());
            }

            // 🔔 NOTIFIER LE NOUVEAU MÉDECIN (si changement)
            if ($newAvailability->doctor_id !== $oldDoctorId) {
                try {
                    $appointment->doctor->user->notify(
                        new \App\Notifications\DoctorNewAppointment($appointment)
                    );
                } catch (\Exception $e) {
                    \Log::error('Erreur notification médecin: ' . $e->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Rendez-vous reprogrammé avec succès. Le patient et le médecin ont été notifiés.',
                'appointment' => [
                    'id' => $appointment->id,
                    'doctor_name' => 'Dr. ' . ($appointment->doctor->user->first_name ?? '') . ' ' . ($appointment->doctor->user->last_name ?? ''),
                    'patient_name' => ($appointment->patient->user->first_name ?? '') . ' ' . ($appointment->patient->user->last_name ?? ''),
                    'date' => $appointment->debut_at->format('d/m/Y'),
                    'heure_debut' => $appointment->debut_at->format('H:i'),
                    'heure_fin' => $appointment->fin_at->format('H:i'),
                    'statut' => $appointment->statut,
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur reprogrammation: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'error' => 'Erreur lors de la reprogrammation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer tous les médecins pour les filtres
     * Route : GET /api/assistant/doctors
     */
    public function getDoctors()
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $doctors = Doctor::with(['user', 'specialty'])
                ->get()
                ->map(function ($doctor) {
                    return [
                        'id' => $doctor->id,
                        'name' => 'Dr. ' . ($doctor->user->first_name ?? '') . ' ' . ($doctor->user->last_name ?? ''),
                        'specialty' => $doctor->specialty->label ?? 'N/A',
                        'specialty_id' => $doctor->specialty_id,
                    ];
                });

            return response()->json($doctors, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la récupération des médecins',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
