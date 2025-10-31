<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function listDoctors(Request $request)
    {
        $doctors = Doctor::with(['user:id,first_name,last_name,image','specialty:id,label'])
            ->orderByDesc('id')
            ->paginate(20);
        return response()->json($doctors);
    }

    public function doctorAvailabilities(Doctor $doctor)
    {
        $availabilities = $doctor->availabilities()->whereDate('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('heure_debut')
            ->get();
        return response()->json($availabilities);
    }
}


