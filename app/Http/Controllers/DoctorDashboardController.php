<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DoctorDashboardController extends Controller
{
    /**
     * Récupérer toutes les statistiques pour le dashboard docteur
     * Route: GET /api/doctor/dashboard/stats
     */
    public function getStats(Request $request)
    {
        try {
            $user = Auth::user();

            // Vérifier que l'utilisateur est bien un docteur
            if ($user->role !== 'MEDECIN') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['error' => 'Docteur non trouvé'], 404);
            }

            // Validation des filtres
            $filter = $request->input('filter', '30'); // Par défaut 30 jours
            $startDate = $this->getStartDate($filter);

            // ========== 1. STATISTIQUES GÉNÉRALES ==========
            $overview = $this->getOverviewStats($doctor, $startDate);

            // ========== 2. RADIAL BAR DATA (Répartition du temps) ==========
            $timeDistribution = $this->getTimeDistribution($doctor, $startDate);

            // ========== 3. STREAM GRAPH DATA (Évolution des pathologies) ==========
            $pathologyTrends = $this->getPathologyTrends($doctor, $startDate);

            // ========== 4. CALENDAR HEATMAP DATA (Taux de remplissage) ==========
            $calendarData = $this->getCalendarHeatmap($doctor, $startDate);

            // ========== 5. RENDEZ-VOUS PAR JOUR ==========
            $appointmentsByDay = $this->getAppointmentsByDay($doctor, $startDate);

            // ========== 6. REVENUS PAR MOIS ==========
            $revenueByMonth = $this->getRevenueByMonth($doctor, $startDate);

            return response()->json([
                'success' => true,
                'filter' => $filter,
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => Carbon::now()->format('Y-m-d')
                ],
                'doctor' => [
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'specialty' => $doctor->specialty->label ?? 'N/A',
                ],
                'data' => [
                    'overview' => $overview,
                    'time_distribution' => $timeDistribution,
                    'pathology_trends' => $pathologyTrends,
                    'calendar_heatmap' => $calendarData,
                    'appointments_by_day' => $appointmentsByDay,
                    'revenue_by_month' => $revenueByMonth,
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
     * Calculer la date de début selon le filtre
     */
    private function getStartDate($filter)
    {
        return match($filter) {
            '7' => Carbon::now()->subDays(7),
            '30' => Carbon::now()->subDays(30),
            '90' => Carbon::now()->subDays(90),
            '365' => Carbon::now()->subYear(),
            default => Carbon::now()->subDays(30),
        };
    }

    /**
     * 1. STATISTIQUES GÉNÉRALES
     */
    private function getOverviewStats($doctor, $startDate)
    {
        $totalPatients = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->distinct('patient_id')
            ->count('patient_id');

        $totalAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->count();

        $confirmedAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'CONFIRME')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $completedAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'COMPLETE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $canceledAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'ANNULE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $totalRevenue = Appointment::where('doctor_id', $doctor->id)
            ->where('est_paye', true)
            ->where('debut_at', '>=', $startDate)
            ->sum('prix');

        // Durée moyenne de consultation (en minutes)
        $avgDuration = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, debut_at, fin_at)) as avg_duration')
            ->value('avg_duration');

        // Patients récurrents (2+ RDV)
        $recurringPatients = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->select('patient_id', DB::raw('COUNT(*) as count'))
            ->groupBy('patient_id')
            ->having('count', '>=', 2)
            ->count();

        return [
            'total_patients' => $totalPatients,
            'total_appointments' => $totalAppointments,
            'confirmed_appointments' => $confirmedAppointments,
            'completed_appointments' => $completedAppointments,
            'canceled_appointments' => $canceledAppointments,
            'cancellation_rate' => $totalAppointments > 0 ? round(($canceledAppointments / $totalAppointments) * 100, 2) : 0,
            'total_revenue' => round($totalRevenue, 2),
            'avg_duration' => round($avgDuration ?? 0, 2),
            'recurring_patients' => $recurringPatients,
        ];
    }

    /**
     * 2. RÉPARTITION DU TEMPS (Radial Bar)
     */
    private function getTimeDistribution($doctor, $startDate)
    {
        $confirmed = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'CONFIRME')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $completed = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'COMPLETE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $canceled = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'ANNULE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $pending = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'EN ATTENTE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        return [
            ['label' => 'Confirmés', 'value' => $confirmed],
            ['label' => 'Complétés', 'value' => $completed],
            ['label' => 'Annulés', 'value' => $canceled],
            ['label' => 'En Attente', 'value' => $pending],
        ];
    }

    /**
     * 3. ÉVOLUTION DES PATHOLOGIES (Stream Graph)
     */
    private function getPathologyTrends($doctor, $startDate)
    {
        // Grouper par mois et motif
        $trends = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->whereNotNull('motif')
            ->select(
                DB::raw('DATE_FORMAT(debut_at, "%Y-%m") as month'),
                'motif',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month', 'motif')
            ->orderBy('month')
            ->get();

        // Transformer en format exploitable
        $result = [];
        foreach ($trends as $trend) {
            $result[] = [
                'month' => $trend->month,
                'motif' => $trend->motif,
                'count' => $trend->count
            ];
        }

        return $result;
    }

    /**
     * 4. CALENDAR HEATMAP (Taux de remplissage)
     */
    private function getCalendarHeatmap($doctor, $startDate)
    {
        $appointments = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->select(
                DB::raw('DATE(debut_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $appointments->map(function($item) {
            return [
                'date' => $item->date,
                'count' => $item->count
            ];
        });
    }

    /**
     * 5. RENDEZ-VOUS PAR JOUR
     */
    private function getAppointmentsByDay($doctor, $startDate)
    {
        return Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->select(
                DB::raw('DATE(debut_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'date_formatted' => Carbon::parse($item->date)->format('d/m/Y'),
                    'count' => $item->count
                ];
            });
    }

    /**
     * 6. REVENUS PAR MOIS
     */
    private function getRevenueByMonth($doctor, $startDate)
    {
        return Appointment::where('doctor_id', $doctor->id)
            ->where('est_paye', true)
            ->where('debut_at', '>=', $startDate)
            ->select(
                DB::raw('DATE_FORMAT(debut_at, "%Y-%m") as month'),
                DB::raw('SUM(prix) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function($item) {
                return [
                    'month' => $item->month,
                    'month_formatted' => Carbon::parse($item->month . '-01')->format('M Y'),
                    'revenue' => round($item->revenue, 2),
                    'count' => $item->count
                ];
            });
    }

    /**
     * Générer et télécharger le PDF
     * Route: GET /api/doctor/dashboard/export-pdf
     */
    public function exportPDF(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'MEDECIN') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['error' => 'Docteur non trouvé'], 404);
            }

            $filter = $request->input('filter', '30');
            $startDate = $this->getStartDate($filter);

            $overview = $this->getOverviewStats($doctor, $startDate);
            $timeDistribution = $this->getTimeDistribution($doctor, $startDate);
            $appointmentsByDay = $this->getAppointmentsByDay($doctor, $startDate)->toArray();
            $revenueByMonth = $this->getRevenueByMonth($doctor, $startDate)->toArray();

            $data = [
                'overview' => $overview,
                'timeDistribution' => $timeDistribution,
                'appointmentsByDay' => $appointmentsByDay,
                'revenueByMonth' => $revenueByMonth,
                'period' => [
                    'start' => $startDate->format('d/m/Y'),
                    'end' => Carbon::now()->format('d/m/Y')
                ],
                'generated_at' => Carbon::now()->format('d/m/Y H:i'),
                'doctor_name' => $user->first_name . ' ' . $user->last_name,
                'specialty' => $doctor->specialty->label ?? 'N/A',
                'filter_label' => $this->getFilterLabel($filter)
            ];

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('doctor.dashboard-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            return $pdf->download('rapport-medecin-' . Carbon::now()->format('Y-m-d') . '.pdf');

        } catch (\Exception $e) {
            \Log::error('Erreur PDF Docteur:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la génération du PDF',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le libellé du filtre
     */
    private function getFilterLabel($filter)
    {
        return match($filter) {
            '7' => '7 derniers jours',
            '30' => '30 derniers jours',
            '90' => '90 derniers jours',
            '365' => '1 an',
            default => '30 derniers jours',
        };
    }
}
