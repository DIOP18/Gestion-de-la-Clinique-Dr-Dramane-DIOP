<?php

namespace App\Http\Controllers;

use App\Models\Appointment;

use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;


class RendezVousController extends Controller
{
    public function patientCreate(Request $request)
    {
        $data = $request->all();

        $validator = Validator::make($data, [
            'doctor_id' => ['required', 'exists:doctors,id'],
            'debut_at' => ['required', 'date'],
            'fin_at' => ['required', 'date', 'after:debut_at'],
            'motif' => ['nullable', 'string'],
            'availability_id' => ['nullable', 'exists:disponibilites,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $doctor = Doctor::with('specialty')->findOrFail($data['doctor_id']);
        $patient = $request->user()->patient;
        $prix = $doctor->specialty->prix ?? 0;
        $rdv = Appointment::create([
            'doctor_id' => $data['doctor_id'],
            'patient_id' => $patient->id,
            'assistant_id' => null,
            'availability_id' => $data['availability_id'] ?? null,
            'debut_at' => $data['debut_at'],
            'fin_at' => $data['fin_at'],
            'statut' => 'EN ATTENTE',
            'motif' => $data['motif'] ?? null,
            'cree_par_type' => 'PATIENT',
            'cree_par_user_id' => $request->user()->id,
            'prix' => $prix,
        ]);

        return response()->json([
            'message' => 'Rendez-vous créé avec succès',
            'rendez_vous' => $rdv,
        ]);
    }

    /**
     * Création d’un rendez-vous par un assistant
     */
    public function assistantCreate(Request $request)
    {
        $data = $request->all();

        $validator = Validator::make($data, [
            'doctor_id' => ['required', 'exists:doctors,id'],
            'patient_id' => ['required', 'exists:patients,id'],
            'debut_at' => ['required', 'date'],
            'fin_at' => ['required', 'date', 'after:debut_at'],
            'motif' => ['nullable', 'string'],
            'availability_id' => ['nullable', 'exists:disponibilites,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $doctor = Doctor::with('specialty')->findOrFail($data['doctor_id']);
        $prix = $doctor->specialty->prix ?? 0;

        $rdv = Appointment::create([
            'doctor_id' => $data['doctor_id'],
            'patient_id' => $data['patient_id'],
            'assistant_id' => $request->user()->id,
            'availability_id' => $data['availability_id'] ?? null,
            'debut_at' => $data['debut_at'],
            'fin_at' => $data['fin_at'],
            'statut' => 'EN ATTENTE',
            'motif' => $data['motif'] ?? null,
            'cree_par_type' => 'ASSISTANT',
            'cree_par_user_id' => $request->user()->id,
            'prix' => $prix,
        ]);

        return response()->json([
            'message' => 'Rendez-vous créé avec succès par l’assistant',
            'rendez_vous' => $rdv,
        ]);
    }

    /**
     * Liste des rendez-vous d’un patient
     */
    public function patientAppointments(Request $request)
    {
        $patient = $request->user()->patient;

        $appointments = Appointment::where('patient_id', $patient->id)
            ->with(['doctor.specialty'])
            ->orderByDesc('debut_at')
            ->get();

        return response()->json($appointments);
    }
}


