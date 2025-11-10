<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;

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
}
