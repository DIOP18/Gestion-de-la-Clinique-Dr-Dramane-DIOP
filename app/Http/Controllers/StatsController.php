<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Assistant;
use App\Models\Doctor;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function admin(Request $request)
    {
        $byRole = User::select('role', DB::raw('COUNT(*) as count'))
            ->groupBy('role')->pluck('count', 'role');

        $byStatus = Appointment::select('statut', DB::raw('COUNT(*) as count'))
            ->groupBy('statut')->pluck('count', 'statut');

        $today = today()->toDateString();
        $todayCount = Appointment::whereDate('debut_at', $today)->count();
        $upcomingCount = Appointment::whereDate('debut_at', '>', $today)->count();

        $revenue = Payment::where('status', 'SUCCESS')->sum('amount');

        return response()->json([
            'users' => [
                'total' => User::count(),
                'by_role' => $byRole,
            ],
            'appointments' => [
                'total' => Appointment::count(),
                'by_status' => $byStatus,
                'today' => $todayCount,
                'upcoming' => $upcomingCount,
            ],
            'revenue' => [
                'total_success_payments' => (float) $revenue,
                'currency' => 'XOF',
            ],
        ]);
    }

    public function doctor(Request $request)
    {
        $doctor = Doctor::where('user_id', $request->user()->id)->first();
        if (!$doctor) return response()->json(['message' => 'Médecin introuvable'], 404);

        $base = Appointment::where('doctor_id', $doctor->id);
        $byStatus = (clone $base)->select('statut', DB::raw('COUNT(*) as count'))
            ->groupBy('statut')->pluck('count', 'statut');

        $today = today()->toDateString();
        $todayCount = (clone $base)->whereDate('debut_at', $today)->count();
        $upcomingCount = (clone $base)->whereDate('debut_at', '>', $today)->count();

        $revenue = Payment::whereHas('appointment', function($q) use ($doctor){
                $q->where('doctor_id', $doctor->id);
            })
            ->where('status', 'SUCCESS')
            ->sum('amount');

        return response()->json([
            'appointments' => [
                'total' => (clone $base)->count(),
                'by_status' => $byStatus,
                'today' => $todayCount,
                'upcoming' => $upcomingCount,
            ],
            'revenue' => [
                'total_success_payments' => (float) $revenue,
                'currency' => 'XOF',
            ],
        ]);
    }

    public function assistant(Request $request)
    {
        $assistant = Assistant::where('user_id', $request->user()->id)->first();
        if (!$assistant) return response()->json(['message' => 'Assistant introuvable'], 404);

        $base = Appointment::where('assistant_id', $assistant->id);
        $byStatus = (clone $base)->select('statut', DB::raw('COUNT(*) as count'))
            ->groupBy('statut')->pluck('count', 'statut');

        $today = today()->toDateString();
        $todayCount = (clone $base)->whereDate('debut_at', $today)->count();
        $upcomingCount = (clone $base)->whereDate('debut_at', '>', $today)->count();

        return response()->json([
            'appointments' => [
                'total' => (clone $base)->count(),
                'by_status' => $byStatus,
                'today' => $todayCount,
                'upcoming' => $upcomingCount,
            ],
        ]);
    }
}


