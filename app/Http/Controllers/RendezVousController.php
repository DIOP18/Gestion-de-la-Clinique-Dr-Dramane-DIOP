<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Assistant;
use App\Models\Availability;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class RendezVousController extends Controller
{
    protected function currentDoctor(Request $request): ?Doctor
    {
        return Doctor::where('user_id', $request->user()->id)->first();
    }

    protected function currentAssistant(Request $request): ?Assistant
    {
        return Assistant::where('user_id', $request->user()->id)->first();
    }

    protected function currentPatient(Request $request): ?Patient
    {
        return Patient::where('user_id', $request->user()->id)->first();
    }

    protected function ensurePatientForCurrentUser(Request $request): Patient
    {
        $patient = $this->currentPatient($request);
        if ($patient) return $patient;
        // create minimal patient profile if missing
        return Patient::create([
            'user_id' => $request->user()->id,
            'num_patient' => 'PAT-'.str_pad((string)(Patient::max('id') + 1), 6, '0', STR_PAD_LEFT),
        ]);
    }

    public function listForPatient(Request $request)
    {
        $patient = $this->currentPatient($request);
        if (!$patient) return response()->json([]);
        $items = Appointment::where('patient_id', $patient->id)->with('doctor.user:id,first_name,last_name')
            ->orderByDesc('debut_at')->get();
        return response()->json($items);
    }

    public function listForDoctor(Request $request)
    {
        $doctor = $this->currentDoctor($request);
        if (!$doctor) return response()->json([]);
        $items = Appointment::where('doctor_id', $doctor->id)->with('patient.user:id,first_name,last_name')
            ->orderByDesc('debut_at')->get();
        return response()->json($items);
    }

    public function listForAssistant(Request $request)
    {
        $assistant = $this->currentAssistant($request);
        if (!$assistant) return response()->json([]);
        $items = Appointment::where('assistant_id', $assistant->id)
            ->orderByDesc('debut_at')->get();
        return response()->json($items);
    }

    public function patientCreate(Request $request)
    {
        $data = $request->validate([
            'doctor_id' => ['required','exists:doctors,id'],
            'availability_id' => ['nullable','exists:disponibilites,id'],
            'debut_at' => ['nullable','date'],
            'fin_at' => ['nullable','date','after:debut_at'],
            'motif' => ['nullable','string','max:255'],
            'prix' => ['required','numeric','min:0'],
        ]);
        $patient = $this->ensurePatientForCurrentUser($request);

        return DB::transaction(function () use ($data, $patient, $request) {
            if (!empty($data['availability_id'])) {
                $disp = Availability::find($data['availability_id']);
                if (!$disp || $disp->doctor_id != $data['doctor_id']) {
                    return response()->json(['message' => "Disponibilité invalide"], 422);
                }
                // compute times if not provided
                if (empty($data['debut_at']) || empty($data['fin_at'])) {
                    $data['debut_at'] = $disp->date.' '.$disp->heure_debut;
                    $data['fin_at'] = $disp->date.' '.$disp->heure_fin;
                }
            }

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
                'prix' => $data['prix'],
            ]);

            // Simple email notification
            try { Mail::raw('Votre rendez-vous a été créé.', function($m) use ($request){ $m->to($request->user()->email)->subject('Rendez-vous créé'); }); } catch (\Throwable $e) {}

            return response()->json($rdv, 201);
        });
    }

    public function assistantCreate(Request $request)
    {
        $assistant = $this->currentAssistant($request);
        if (!$assistant) return response()->json(['message' => 'Assistant introuvable'], 404);

        $data = $request->validate([
            'patient_id' => ['required','exists:patients,id'],
            'doctor_id' => ['required','exists:doctors,id'],
            'availability_id' => ['nullable','exists:disponibilites,id'],
            'debut_at' => ['nullable','date'],
            'fin_at' => ['nullable','date','after:debut_at'],
            'motif' => ['nullable','string','max:255'],
            'prix' => ['required','numeric','min:0'],
        ]);

        return DB::transaction(function () use ($data, $assistant, $request) {
            if (!empty($data['availability_id'])) {
                $disp = Availability::find($data['availability_id']);
                if (!$disp || $disp->doctor_id != $data['doctor_id']) {
                    return response()->json(['message' => "Disponibilité invalide"], 422);
                }
                if (empty($data['debut_at']) || empty($data['fin_at'])) {
                    $data['debut_at'] = $disp->date.' '.$disp->heure_debut;
                    $data['fin_at'] = $disp->date.' '.$disp->heure_fin;
                }
            }

            $rdv = Appointment::create([
                'doctor_id' => $data['doctor_id'],
                'patient_id' => $data['patient_id'],
                'assistant_id' => $assistant->id,
                'availability_id' => $data['availability_id'] ?? null,
                'debut_at' => $data['debut_at'],
                'fin_at' => $data['fin_at'],
                'statut' => 'EN ATTENTE',
                'motif' => $data['motif'] ?? null,
                'cree_par_type' => 'ASSISTANT',
                'cree_par_user_id' => $request->user()->id,
                'prix' => $data['prix'],
            ]);
            return response()->json($rdv, 201);
        });
    }

    public function updateStatutConfirm(Request $request, Appointment $rendez_vou)
    {
        $rendez_vou->update(['statut' => 'CONFIRME']);
        try { $this->notifyPatient($rendez_vou, 'Votre rendez-vous est confirmé.'); } catch (\Throwable $e) {}
        return response()->json($rendez_vou);
    }

    public function updateStatutCancel(Request $request, Appointment $rendez_vou)
    {
        $rendez_vou->update(['statut' => 'ANNULE']);
        try { $this->notifyPatient($rendez_vou, 'Votre rendez-vous est annulé.'); } catch (\Throwable $e) {}
        return response()->json($rendez_vou);
    }

    public function updateStatutComplete(Request $request, Appointment $rendez_vou)
    {
        $rendez_vou->update(['statut' => 'COMPLETE']);
        return response()->json($rendez_vou);
    }

    public function reschedule(Request $request, Appointment $rendez_vou)
    {
        $data = $request->validate([
            'debut_at' => ['required','date'],
            'fin_at' => ['required','date','after:debut_at'],
            'availability_id' => ['nullable','exists:disponibilites,id'],
        ]);
        $rendez_vou->update([
            'debut_at' => $data['debut_at'],
            'fin_at' => $data['fin_at'],
            'availability_id' => $data['availability_id'] ?? null,
            'statut' => 'REPORT',
        ]);
        return response()->json($rendez_vou);
    }

    protected function notifyPatient(Appointment $rdv, string $message): void
    {
        if (!$rdv->patient || !$rdv->patient->user) return;
        Mail::raw($message, function ($m) use ($rdv) {
            $m->to($rdv->patient->user->email)->subject('Notification Rendez-vous');
        });
    }
}


