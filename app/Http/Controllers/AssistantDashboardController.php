<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssistantDashboardController extends Controller
{
    /**
     * Récupérer toutes les statistiques pour le dashboard assistant
     * Route: GET /api/assistant/dashboard/stats
     */
    public function getStats(Request $request)
    {
        try {
            $user = Auth::user();

            // Vérifier que l'utilisateur est bien un assistant
            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $today = Carbon::today();

            // ========== 1. STATISTIQUES GÉNÉRALES DU JOUR ==========
            $overview = $this->getOverviewStats($today);

            // ========== 2. GANTT DATA (Agenda de tous les docteurs aujourd'hui) ==========
            $ganttData = $this->getGanttData($today);

            // ========== 3. FUNNEL DATA (Statuts des RDV) ==========
            $funnelData = $this->getFunnelData($today);

            // ========== 4. PIE CHARTS DATA ==========
            $paymentStats = $this->getPaymentStats($today);
            $statusStats = $this->getStatusStats($today);

            // ========== 5. TABLEAU DES RDV CONFIRMÉS ET PAYÉS ==========
            $confirmedPaidAppointments = $this->getConfirmedPaidAppointments($today);

            // ========== 6. MOTIFS DES RDV (Polar Chart) ==========
            $motivesStats = $this->getMotivesStats($today);

            return response()->json([
                'success' => true,
                'date' => $today->format('Y-m-d'),
                'date_formatted' => $today->format('d/m/Y'),
                'data' => [
                    'overview' => $overview,
                    'gantt' => $ganttData,
                    'funnel' => $funnelData,
                    'payment_stats' => $paymentStats,
                    'status_stats' => $statusStats,
                    'confirmed_paid_appointments' => $confirmedPaidAppointments,
                    'motives_stats' => $motivesStats,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des statistiques',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 1. STATISTIQUES GÉNÉRALES
     */
    private function getOverviewStats($today)
    {
        $totalAppointmentsToday = Appointment::whereDate('debut_at', $today)->count();

        $confirmedToday = Appointment::where('statut', 'CONFIRME')
            ->whereDate('debut_at', $today)
            ->count();

        $paidToday = Appointment::where('est_paye', true)
            ->whereDate('debut_at', $today)
            ->count();

        $unpaidToday = Appointment::where('est_paye', false)
            ->whereIn('statut', ['CONFIRME', 'EN ATTENTE'])
            ->whereDate('debut_at', $today)
            ->count();

        $canceledToday = Appointment::where('statut', 'ANNULE')
            ->whereDate('debut_at', $today)
            ->count();

        $completedToday = Appointment::where('statut', 'COMPLETE')
            ->whereDate('debut_at', $today)
            ->count();

        $totalRevenue = Appointment::where('est_paye', true)
            ->whereDate('debut_at', $today)
            ->sum('prix');

        $activeDoctors = Doctor::whereHas('appointments', function($q) use ($today) {
            $q->whereDate('debut_at', $today);
        })->count();

        return [
            'total_appointments_today' => $totalAppointmentsToday,
            'confirmed_today' => $confirmedToday,
            'paid_today' => $paidToday,
            'unpaid_today' => $unpaidToday,
            'canceled_today' => $canceledToday,
            'completed_today' => $completedToday,
            'total_revenue_today' => round($totalRevenue, 2),
            'active_doctors_today' => $activeDoctors,
        ];
    }

    /**
     * 2. GANTT DATA (Agenda des docteurs)
     */
    private function getGanttData($today)
    {
        $appointments = Appointment::with([
            'doctor.user',
            'doctor.specialty',
            'patient.user'
        ])
            ->whereDate('debut_at', $today)
            ->whereIn('statut', ['CONFIRME', 'EN ATTENTE', 'COMPLETE'])
            ->orderBy('debut_at')
            ->get()
            ->map(function($apt) {
                return [
                    'id' => $apt->id,
                    'doctor_id' => $apt->doctor_id,
                    'doctor_name' => 'Dr. ' . ($apt->doctor->user->first_name ?? '') . ' ' . ($apt->doctor->user->last_name ?? ''),
                    'specialty' => $apt->doctor->specialty->label ?? 'N/A',
                    'patient_name' => ($apt->patient->user->first_name ?? '') . ' ' . ($apt->patient->user->last_name ?? ''),
                    'patient_phone' => $apt->patient->user->phone ?? 'N/A',
                    'debut_at' => $apt->debut_at->format('Y-m-d H:i:s'),
                    'fin_at' => $apt->fin_at->format('Y-m-d H:i:s'),
                    'heure_debut' => $apt->debut_at->format('H:i'),
                    'heure_fin' => $apt->fin_at->format('H:i'),
                    'statut' => $apt->statut,
                    'est_paye' => $apt->est_paye,
                    'prix' => $apt->prix,
                    'motif' => $apt->motif ?? 'Non spécifié',
                ];
            });

        return $appointments;
    }

    /**
     * 3. FUNNEL DATA (Flux des statuts)
     */
    private function getFunnelData($today)
    {
        $enAttente = Appointment::where('statut', 'EN ATTENTE')
            ->whereDate('debut_at', $today)
            ->count();

        $confirme = Appointment::where('statut', 'CONFIRME')
            ->whereDate('debut_at', $today)
            ->count();

        $complete = Appointment::where('statut', 'COMPLETE')
            ->whereDate('debut_at', $today)
            ->count();

        return [
            ['label' => 'En Attente', 'value' => $enAttente],
            ['label' => 'Confirmé', 'value' => $confirme],
            ['label' => 'Complété', 'value' => $complete],
        ];
    }

    /**
     * 4. PAYMENT STATS (Payés vs Non payés)
     */
    private function getPaymentStats($today)
    {
        $paid = Appointment::where('est_paye', true)
            ->whereDate('debut_at', $today)
            ->count();

        $unpaid = Appointment::where('est_paye', false)
            ->whereIn('statut', ['CONFIRME', 'EN ATTENTE'])
            ->whereDate('debut_at', $today)
            ->count();

        return [
            ['label' => 'Payés', 'value' => $paid],
            ['label' => 'Non Payés', 'value' => $unpaid],
        ];
    }

    /**
     * 5. STATUS STATS (Distribution par statut)
     */
    private function getStatusStats($today)
    {
        return Appointment::select('statut', DB::raw('COUNT(*) as count'))
            ->whereDate('debut_at', $today)
            ->groupBy('statut')
            ->get()
            ->map(function($item) {
                return [
                    'label' => $item->statut,
                    'value' => $item->count
                ];
            });
    }

    /**
     * 6. RDV CONFIRMÉS ET PAYÉS
     */
    private function getConfirmedPaidAppointments($today)
    {
        return Appointment::with([
            'doctor.user',
            'doctor.specialty',
            'patient.user'
        ])
            ->where('statut', 'CONFIRME')
            ->where('est_paye', true)
            ->whereDate('debut_at', $today)
            ->orderBy('debut_at')
            ->get()
            ->map(function($apt) {
                return [
                    'id' => $apt->id,
                    'doctor_name' => 'Dr. ' . ($apt->doctor->user->first_name ?? '') . ' ' . ($apt->doctor->user->last_name ?? ''),
                    'specialty' => $apt->doctor->specialty->label ?? 'N/A',
                    'patient_name' => ($apt->patient->user->first_name ?? '') . ' ' . ($apt->patient->user->last_name ?? ''),
                    'patient_phone' => $apt->patient->user->phone ?? 'N/A',
                    'heure_debut' => $apt->debut_at->format('H:i'),
                    'heure_fin' => $apt->fin_at->format('H:i'),
                    'prix' => $apt->prix,
                    'paye_par' => $apt->paye_par ?? 'N/A',
                    'motif' => $apt->motif ?? 'Non spécifié',
                ];
            });
    }

    /**
     * 7. MOTIFS DES RDV (Polar Chart)
     */
    private function getMotivesStats($today)
    {
        $motives = Appointment::select('motif', DB::raw('COUNT(*) as count'))
            ->whereDate('debut_at', $today)
            ->whereIn('statut', ['CONFIRME', 'COMPLETE'])
            ->whereNotNull('motif')
            ->groupBy('motif')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(function($item) {
                return [
                    'label' => $item->motif ?: 'Non spécifié',
                    'value' => $item->count
                ];
            });

        // Si aucun motif, retourner des données par défaut
        if ($motives->isEmpty()) {
            return [
                ['label' => 'Consultation générale', 'value' => 0],
                ['label' => 'Suivi', 'value' => 0],
                ['label' => 'Urgence', 'value' => 0],
            ];
        }

        return $motives;
    }

    /**
     * Mettre à jour l'heure d'un rendez-vous (Drag & Drop)
     * Route: PATCH /api/assistant/appointments/{id}/update-time
     */
    public function updateAppointmentTime(Request $request, $id)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $request->validate([
                'debut_at' => ['required', 'date'],
                'fin_at' => ['required', 'date', 'after:debut_at'],
            ]);

            $appointment = Appointment::findOrFail($id);

            $appointment->update([
                'debut_at' => $request->debut_at,
                'fin_at' => $request->fin_at,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Horaire mis à jour avec succès',
                'appointment' => $appointment->load('doctor.user', 'patient.user')
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la mise à jour',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer et télécharger le PDF
     * Route: GET /api/assistant/dashboard/export-pdf
     */
    public function exportPDF(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'ASSISTANT') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $today = Carbon::today();

            $overview = $this->getOverviewStats($today);
            $ganttData = $this->getGanttData($today)->toArray();
            $funnelData = $this->getFunnelData($today);
            $paymentStats = $this->getPaymentStats($today);
            $statusStats = $this->getStatusStats($today)->toArray();
            $confirmedPaidAppointments = $this->getConfirmedPaidAppointments($today)->toArray();
            $motivesStats = $this->getMotivesStats($today)->toArray();

            $data = [
                'overview' => $overview,
                'ganttData' => $ganttData,
                'funnelData' => $funnelData,
                'paymentStats' => $paymentStats,
                'statusStats' => $statusStats,
                'confirmedPaidAppointments' => $confirmedPaidAppointments,
                'motivesStats' => $motivesStats,
                'date' => $today->format('d/m/Y'),
                'generated_at' => Carbon::now()->format('d/m/Y H:i'),
                'assistant_name' => $user->first_name . ' ' . $user->last_name
            ];

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('assistant.dashboard-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            return $pdf->download('rapport-assistant-' . $today->format('Y-m-d') . '.pdf');

        } catch (\Exception $e) {
            \Log::error('Erreur PDF Assistant:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la génération du PDF',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
