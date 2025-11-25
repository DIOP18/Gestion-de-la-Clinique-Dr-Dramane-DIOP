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

            if ($user->role !== 'MEDECIN') {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['error' => 'Docteur non trouvé'], 404);
            }

            $filter = $request->input('filter', '30');
            $startDate = $this->getStartDate($filter);

            // Statistiques
            $overview = $this->getOverviewStats($doctor, $startDate);
            $timeDistribution = $this->getTimeDistribution($doctor, $startDate);
            $pathologyTrends = $this->getPathologyTrends($doctor, $startDate);
            $calendarData = $this->getCalendarHeatmap($doctor, $startDate);
            $appointmentsByDay = $this->getAppointmentsByDay($doctor, $startDate);
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
        // Patients uniques
        $totalPatients = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->distinct('patient_id')
            ->count('patient_id');

        // Total rendez-vous
        $totalAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->count();

        // RDV Aujourd'hui
        $appointmentsToday = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('debut_at', Carbon::today())
            ->count();

        // Rendez-vous d'aujourd'hui détaillés
        $todayAppointments = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('debut_at', Carbon::today())
            ->with('patient.user')
            ->orderBy('debut_at')
            ->get()
            ->map(function($apt) {
                return [
                    'id' => $apt->id,
                    'time' => Carbon::parse($apt->debut_at)->format('H:i'),
                    'patient_name' => $apt->patient->user->first_name . ' ' . $apt->patient->user->last_name,
                    'motif' => $apt->motif ?? 'Consultation',
                    'status' => $apt->statut
                ];
            });

        // Par statut
        $confirmedAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'CONFIRME')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $canceledAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'ANNULE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $rescheduledAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'REPORT')
            ->where('debut_at', '>=', $startDate)
            ->count();

        // Revenus
        $totalRevenue = Appointment::where('doctor_id', $doctor->id)
            ->where('est_paye', true)
            ->where('debut_at', '>=', $startDate)
            ->sum('prix');

        // Durée moyenne
        $avgDuration = Appointment::where('doctor_id', $doctor->id)
            ->where('debut_at', '>=', $startDate)
            ->whereNotNull('fin_at')
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
            'appointments_today' => $appointmentsToday,
            'today_appointments' => $todayAppointments,
            'confirmed_appointments' => $confirmedAppointments,
            'canceled_appointments' => $canceledAppointments,
            'rescheduled_appointments' => $rescheduledAppointments,
            'cancellation_rate' => $totalAppointments > 0
                ? round(($canceledAppointments / $totalAppointments) * 100, 2)
                : 0,
            'total_revenue' => round($totalRevenue, 2),
            'avg_duration' => round($avgDuration ?? 0, 0),
            'recurring_patients' => $recurringPatients,
        ];
    }

    /**
     * 2. RÉPARTITION DU TEMPS (PIE CHART)
     * Statuts: EN ATTENTE, CONFIRME, ANNULE, REPORT
     */
    private function getTimeDistribution($doctor, $startDate)
    {
        $pending = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'EN ATTENTE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $confirmed = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'CONFIRME')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $canceled = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'ANNULE')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $rescheduled = Appointment::where('doctor_id', $doctor->id)
            ->where('statut', 'REPORT')
            ->where('debut_at', '>=', $startDate)
            ->count();

        return [
            ['label' => 'Confirmés', 'value' => $confirmed],
            ['label' => 'En Attente', 'value' => $pending],
            ['label' => 'Annulés', 'value' => $canceled],
            ['label' => 'Reportés', 'value' => $rescheduled],
        ];
    }

    /**
     * 3. ÉVOLUTION DES PATHOLOGIES
     */
    private function getPathologyTrends($doctor, $startDate)
    {
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

        return $trends->map(function($trend) {
            return [
                'month' => $trend->month,
                'motif' => $trend->motif,
                'count' => $trend->count
            ];
        });
    }

    /**
     * 4. CALENDAR HEATMAP
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
