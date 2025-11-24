<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Assistant;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class DashboardController extends Controller
{
    /**
     * Récupérer toutes les statistiques pour le dashboard admin
     * Route: GET /api/admin/dashboard/stats
     */
    public function getAdminStats(Request $request)
    {
        try {
            // Validation des filtres
            $filter = $request->input('filter', '30'); // Par défaut 30 jours
            $startDate = $this->getStartDate($filter);

            // ========== 1. STATISTIQUES GÉNÉRALES ==========
            $overview = $this->getOverviewStats($startDate);

            // ========== 2. RENDEZ-VOUS PAR JOUR (30 derniers jours) ==========
            $appointmentsByDay = $this->getAppointmentsByDay($startDate);

            // ========== 3. HEATMAP TEMPORELLE (Jour × Heure) ==========
            $heatmapData = $this->getHeatmapData($startDate);

            // ========== 4. STATISTIQUES PAR SPÉCIALITÉ ==========
            $specialtyStats = $this->getSpecialtyStats($startDate);

            // ========== 5. RÉSEAU PATIENTS-DOCTEURS ==========
            $networkData = $this->getNetworkData($startDate);

            // ========== 6. PARCOURS PATIENT (Flux) ==========
            $patientJourney = $this->getPatientJourney($startDate);

            return response()->json([
                'success' => true,
                'filter' => $filter,
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => Carbon::now()->format('Y-m-d')
                ],
                'data' => [
                    'overview' => $overview,
                    'appointments_by_day' => $appointmentsByDay,
                    'heatmap' => $heatmapData,
                    'specialty_stats' => $specialtyStats,
                    'network' => $networkData,
                    'patient_journey' => $patientJourney,
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
    private function getOverviewStats($startDate)
    {
        $totalPatients = Patient::count();
        $totalDoctors = Doctor::count();
        $totalAssistants = Assistant::count();

        $appointmentsToday = Appointment::whereDate('debut_at', Carbon::today())->count();

        $appointmentsConfirmed = Appointment::where('statut', 'CONFIRME')
            ->where('debut_at', '>=', $startDate)
            ->count();

        $totalRevenue = Appointment::where('est_paye', true)
            ->where('debut_at', '>=', $startDate)
            ->sum('prix');

        // Nouveaux patients dans la période
        $newPatients = Patient::where('created_at', '>=', $startDate)->count();

        // Patients fidèles (2+ rendez-vous)
        $loyalPatients = Patient::whereHas('appointments', function($q) use ($startDate) {
            $q->where('debut_at', '>=', $startDate);
        }, '>=', 2)->count();

        // Taux d'annulation
        $totalAppointments = Appointment::where('debut_at', '>=', $startDate)->count();
        $canceledAppointments = Appointment::where('statut', 'ANNULE')
            ->where('debut_at', '>=', $startDate)
            ->count();
        $cancellationRate = $totalAppointments > 0 ? round(($canceledAppointments / $totalAppointments) * 100, 2) : 0;

        return [
            'total_patients' => $totalPatients,
            'new_patients' => $newPatients,
            'loyal_patients' => $loyalPatients,
            'total_doctors' => $totalDoctors,
            'total_assistants' => $totalAssistants,
            'total_staff' => $totalDoctors + $totalAssistants,
            'appointments_today' => $appointmentsToday,
            'appointments_confirmed' => $appointmentsConfirmed,
            'total_appointments' => $totalAppointments,
            'canceled_appointments' => $canceledAppointments,
            'cancellation_rate' => $cancellationRate,
            'total_revenue' => round($totalRevenue, 2),
        ];
    }

    /**
     * 2. RENDEZ-VOUS PAR JOUR
     */
    private function getAppointmentsByDay($startDate)
    {
        return Appointment::select(
            DB::raw('DATE(debut_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('debut_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('Y-m-d'),
                    'date_formatted' => Carbon::parse($item->date)->format('d/m/Y'),
                    'count' => $item->count
                ];
            });
    }

    /**
     * 3. HEATMAP TEMPORELLE (Jour de la semaine × Heure)
     */
    private function getHeatmapData($startDate)
    {
        $appointments = Appointment::select(
            DB::raw('DAYOFWEEK(debut_at) as day_num'),
            DB::raw('HOUR(debut_at) as hour'),
            DB::raw('COUNT(*) as count')
        )
            ->where('debut_at', '>=', $startDate)
            ->groupBy('day_num', 'hour')
            ->get();

        $dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

        return $appointments->map(function($item) use ($dayNames) {
            return [
                'day' => $dayNames[$item->day_num - 1],
                'day_num' => $item->day_num,
                'hour' => str_pad($item->hour, 2, '0', STR_PAD_LEFT) . ':00',
                'hour_num' => $item->hour,
                'count' => $item->count
            ];
        });
    }

    /**
     * 4. STATISTIQUES PAR SPÉCIALITÉ
     */
    private function getSpecialtyStats($startDate)
    {
        return Specialty::withCount(['doctors'])
            ->with(['doctors' => function($query) use ($startDate) {
                $query->withCount(['appointments' => function($q) use ($startDate) {
                    $q->where('debut_at', '>=', $startDate);
                }])
                    ->withSum(['appointments' => function($q) use ($startDate) {
                        $q->where('est_paye', true)->where('debut_at', '>=', $startDate);
                    }], 'prix');
            }])
            ->get()
            ->map(function($specialty) {
                $totalRevenue = $specialty->doctors->sum('appointments_sum_prix') ?? 0;
                $totalAppointments = $specialty->doctors->sum('appointments_count') ?? 0;

                return [
                    'id' => $specialty->id,
                    'label' => $specialty->label,
                    'prix' => $specialty->prix,
                    'doctor_count' => $specialty->doctors_count,
                    'total_appointments' => $totalAppointments,
                    'revenue' => round($totalRevenue, 2),
                ];
            });
    }

    /**
     * 5. RÉSEAU PATIENTS-DOCTEURS (pour Force Graph)
     */
    private function getNetworkData($startDate)
    {
        $doctors = Doctor::with('user', 'specialty')
            ->withCount(['appointments' => function($q) use ($startDate) {
                $q->where('debut_at', '>=', $startDate);
            }])
            ->get()
            ->map(function($doctor) {
                return [
                    'id' => 'doctor_' . $doctor->id,
                    'name' => 'Dr. ' . $doctor->user->first_name . ' ' . $doctor->user->last_name,
                    'type' => 'doctor',
                    'specialty' => $doctor->specialty->label ?? 'N/A',
                    'appointment_count' => $doctor->appointments_count,
                ];
            });

        $patients = Patient::with('user')
            ->withCount(['appointments' => function($q) use ($startDate) {
                $q->where('debut_at', '>=', $startDate);
            }])
            ->having('appointments_count', '>', 0)
            ->limit(50) // Limiter pour ne pas surcharger le graph
            ->get()
            ->map(function($patient) {
                return [
                    'id' => 'patient_' . $patient->id,
                    'name' => $patient->user->first_name . ' ' . $patient->user->last_name,
                    'type' => 'patient',
                    'appointment_count' => $patient->appointments_count,
                ];
            });

        // Relations (liens)
        $links = Appointment::select('doctor_id', 'patient_id', DB::raw('COUNT(*) as count'))
            ->where('debut_at', '>=', $startDate)
            ->groupBy('doctor_id', 'patient_id')
            ->get()
            ->map(function($link) {
                return [
                    'source' => 'doctor_' . $link->doctor_id,
                    'target' => 'patient_' . $link->patient_id,
                    'value' => $link->count,
                ];
            });

        return [
            'nodes' => $doctors->concat($patients),
            'links' => $links,
        ];
    }

    /**
     * 6. PARCOURS PATIENT (Sankey Diagram)
     */
    private function getPatientJourney($startDate)
    {
        $newPatients = Patient::where('created_at', '>=', $startDate)->count();

        $firstConsultation = Patient::whereHas('appointments', function($q) use ($startDate) {
            $q->where('debut_at', '>=', $startDate);
        }, '=', 1)->count();

        $followUp = Patient::whereHas('appointments', function($q) use ($startDate) {
            $q->where('debut_at', '>=', $startDate);
        }, '>=', 2)->count();

        $loyalPatients = $followUp; // Patients avec 2+ RDV = fidèles

        return [
            'new_patients' => $newPatients,
            'first_consultation' => $firstConsultation,
            'follow_up' => $followUp,
            'loyal_patients' => $loyalPatients,
        ];
    }

    /**
     * Générer et télécharger le PDF
     * Route: GET /api/admin/dashboard/export-pdf
     */
    public function exportPDF(Request $request)
    {
        try {
            $filter = $request->input('filter', '30');
            $startDate = $this->getStartDate($filter);

            $overview = $this->getOverviewStats($startDate);
            $appointmentsByDay = $this->getAppointmentsByDay($startDate)->toArray();
            $specialtyStats = $this->getSpecialtyStats($startDate)->toArray();
            $patientJourney = $this->getPatientJourney($startDate);

            $data = [
                'overview' => $overview,
                'appointmentsByDay' => $appointmentsByDay,
                'specialtyStats' => $specialtyStats,
                'patientJourney' => $patientJourney,
                'period' => [
                    'start' => $startDate->format('d/m/Y'),
                    'end' => Carbon::now()->format('d/m/Y')
                ],
                'generated_at' => Carbon::now()->format('d/m/Y H:i'),
                'filter_label' => $this->getFilterLabel($filter)
            ];

            $pdf = Pdf::loadView('dashboard.pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            return $pdf->download('dashboard-admin-' . Carbon::now()->format('Y-m-d') . '.pdf');

        } catch (\Exception $e) {
            \Log::error('Erreur PDF:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la génération du PDF',
                'details' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
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
