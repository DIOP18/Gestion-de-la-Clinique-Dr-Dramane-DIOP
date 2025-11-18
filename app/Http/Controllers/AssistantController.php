<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Availability;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

            // ========== RENDEZ-VOUS CONFIRMÉS ==========
            // Récupérer tous les RDV confirmés >= aujourd'hui
            $rendezVous = Appointment::with([
                'doctor.user',
                'doctor.specialty',
                'patient.user'
            ])
                ->where('statut', 'CONFIRME')
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
}
