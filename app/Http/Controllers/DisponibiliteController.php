<?php

namespace App\Http\Controllers;

use App\Models\Availability;
use App\Models\Doctor;
use Illuminate\Http\Request;

class DisponibiliteController extends Controller
{
    protected function currentDoctor(Request $request): ?Doctor
    {
        return Doctor::where('user_id', $request->user()->id)->first();
    }

    public function index(Request $request)
    {
        $doctor = $this->currentDoctor($request);
        if (!$doctor) return response()->json(['message' => 'Médecin introuvable'], 404);
        $items = Availability::where('doctor_id', $doctor->id)
            ->orderBy('date')->orderBy('heure_debut')->get();
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $doctor = $this->currentDoctor($request);
        if (!$doctor) return response()->json(['message' => 'Médecin introuvable'], 404);

        $data = $request->validate([
            'date' => ['required','date'],
            'heure_debut' => ['required','date_format:H:i'],
            'heure_fin' => ['required','date_format:H:i','after:heure_debut'],
            'duree_consultation_minutes' => ['required','integer','min:5','max:240'],
        ]);
        $data['doctor_id'] = $doctor->id;
        $item = Availability::create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, Availability $disponibilite)
    {
        $doctor = $this->currentDoctor($request);
        if (!$doctor || $disponibilite->doctor_id !== $doctor->id) return response()->json(['message' => 'Accès refusé'], 403);

        $data = $request->validate([
            'date' => ['sometimes','date'],
            'heure_debut' => ['sometimes','date_format:H:i'],
            'heure_fin' => ['sometimes','date_format:H:i','after:heure_debut'],
            'duree_consultation_minutes' => ['sometimes','integer','min:5','max:240'],
        ]);
        $disponibilite->update($data);
        return response()->json($disponibilite);
    }

    public function destroy(Request $request, Availability $disponibilite)
    {
        $doctor = $this->currentDoctor($request);
        if (!$doctor || $disponibilite->doctor_id !== $doctor->id) return response()->json(['message' => 'Accès refusé'], 403);
        $disponibilite->delete();
        return response()->json(['message' => 'Supprimé']);
    }
}


