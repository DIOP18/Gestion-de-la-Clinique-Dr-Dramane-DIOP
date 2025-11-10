<?php

namespace App\Http\Controllers;

use App\Models\Availability;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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
        if (!$doctor || $disponibilite->doctor_id !== $doctor->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validator = \Validator::make($request->all(), [
            'date' => ['sometimes','date'],
            'heure_debut' => ['sometimes','date_format:H:i'],
            'heure_fin' => ['sometimes','date_format:H:i','after:heure_debut'],
            'duree_consultation_minutes' => ['sometimes','integer','min:5','max:240'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $disponibilite->update($validator->validated());
        return response()->json($disponibilite);
    }


    public function destroy(Request $request, Availability $disponibilite)
    {
        $doctor = $this->currentDoctor($request);
        if (!$doctor || $disponibilite->doctor_id !== $doctor->id) return response()->json(['message' => 'Accès refusé'], 403);
        $disponibilite->delete();
        return response()->json(['message' => 'Supprimé']);
    }
    public function getByDoctor($doctorId, Request $request)
    {
        // Récupérer le mois et l'année depuis les paramètres (optionnel)
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        $disponibilites = Availability::where('doctor_id', $doctorId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereDoesntHave('appointment') // Seulement les créneaux non réservés
            ->orderBy('date')
            ->orderBy('heure_debut')
            ->get()
            ->map(function ($dispo) {
                $dateStr = $dispo->date->format('Y-m-d');

                return [
                    'id' => $dispo->id,
                    'title' => $dispo->heure_debut . ' - ' . $dispo->heure_fin,
                    'start' => $dateStr . 'T' . $dispo->heure_debut,
                    'end' => $dateStr . 'T' . $dispo->heure_fin,
                    'backgroundColor' => '#10b981',
                    'borderColor' => '#059669',
                    'textColor' => '#ffffff',
                    'classNames' => ['disponible-event'],
                    'extendedProps' => [
                        'doctor_id' => $dispo->doctor_id,
                        'duree_consultation' => $dispo->duree_consultation_minutes,
                        'disponible' => true
                    ]
                ];
            });

        return response()->json($disponibilites);
    }
}


