<?php

namespace App\Http\Controllers;

use App\Models\Appointment;

use App\Models\Availability;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Payment;
use App\Services\InvoiceService;
use App\Services\StripePaymentService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;


class RendezVousController extends Controller
{
    protected $stripeService;
    protected $invoiceService;


    public function __construct(StripePaymentService $stripeService,InvoiceService $invoiceService)
    {
        $this->stripeService = $stripeService;
        $this->invoiceService = $invoiceService;

    }

    public function patientCreate(Request $request) {

        $validator = Validator::make($request->all(), [
            'availability_id' => ['required', 'exists:disponibilites,id'],
            'motif' => ['required', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Récupérer la disponibilité avec lock
            $availability = Availability::with('appointment')->lockForUpdate()->find($request->availability_id);

            // Vérifier que le créneau est toujours disponible
            if ($availability->appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Ce créneau n\'est plus disponible'], 409);
            }

            // Récupérer l'utilisateur connecté
            $user = Auth::user();

            $patient = Patient::firstOrCreate(
                ['user_id' => $user->id],
                [
                    // num_patient sera généré automatiquement par le boot() du model
                    'medical_history' => null,
                    'blood_group' => null,
                ]
            );

            // Récupérer le docteur et son prix
            $doctor = Doctor::with('specialty')->findOrFail($availability->doctor_id);
            $prix = $doctor->specialty->prix ?? 0;

            // Créer le rendez-vous
            $appointment = Appointment::create([
                'doctor_id' => $availability->doctor_id,
                'patient_id' => $patient->id,
                'assistant_id' => null,
                'availability_id' => $availability->id,
                'debut_at' => Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->heure_debut),
                'fin_at' => Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->heure_fin),
                'statut' => 'EN ATTENTE',
                'motif' => $request->motif,
                'cree_par_type' => 'PATIENT',
                'cree_par_user_id' => $user->id,
                'prix' => $prix,
                'paye_par' => null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Rendez-vous créé avec succès',
                'appointment' => $appointment->load('doctor.specialty', 'patient'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors de la création du rendez-vous',
                'details' => $e->getMessage()
            ], 500);
        }
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

    public function getAppointments(Request $request)
    {
        try {
            $user = Auth::user();

            // Récupérer le patient connecté
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            // ✅ CORRIGÉ - Utilise debut_at au lieu de date
            $appointments = Appointment::with([
                'doctor.user',
                'doctor.specialty',
                'availability',
                'invoice' // ✅ Charge la relation invoice
            ])
                ->where('patient_id', $patient->id)
                ->orderBy('debut_at', 'desc') // ✅ CORRIGÉ: debut_at au lieu de date
                ->get()
                ->map(function($appointment) {
                    return [
                        'id' => $appointment->id,
                        'doctor_nom' => $appointment->doctor->user->last_name ?? 'N/A',
                        'doctor_prenom' => $appointment->doctor->user->first_name ?? 'N/A',
                        'doctor_full_name' => ($appointment->doctor->user->first_name ?? '') . ' ' . ($appointment->doctor->user->last_name ?? ''),
                        'specialty' => $appointment->doctor->specialty->label ?? 'N/A',
                        'debut_at' => $appointment->debut_at,
                        'fin_at' => $appointment->fin_at,
                        'heure_debut' => Carbon::parse($appointment->debut_at)->format('H:i'),
                        'heure_fin' => Carbon::parse($appointment->fin_at)->format('H:i'),
                        'date' => Carbon::parse($appointment->debut_at)->format('d/m/Y'),
                        'statut' => $appointment->statut,
                        'motif' => $appointment->motif,
                        'est_paye' => $appointment->est_paye,
                        'prix' => $appointment->prix,
                        'paye_par' => $appointment->paye_par,
                        'note_medecin' => $appointment->note_medecin,
                        'invoice' => $appointment->invoice,
                    ];
                });

            return response()->json([
                'appointments' => $appointments
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching appointments: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erreur lors de la récupération des rendez-vous',
                'details' => $e->getMessage()
            ], 500);
        }
    }    /**
     * Annuler un rendez-vous (seulement si EN ATTENTE)
     */
    public function cancelAppointment($id)
    {
        try {
            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            DB::beginTransaction();

            $appointment = Appointment::where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            // Vérifier que le rendez-vous est EN ATTENTE
            if ($appointment->statut !== 'EN ATTENTE') {
                DB::rollBack();
                return response()->json([
                    'error' => 'Vous ne pouvez annuler que les rendez-vous en attente'
                ], 400);
            }

            // Libérer la disponibilité
            if ($appointment->availability_id) {
                $appointment->availability_id = null;
            }

            $appointment->update(['statut' => 'ANNULE']);

            DB::commit();

            return response()->json([
                'message' => 'Rendez-vous annulé avec succès',
                'appointment' => $appointment->load('doctor.user', 'doctor.specialty')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors de l\'annulation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Payer un rendez-vous (seulement si CONFIRME)
     */
    public function createPaymentIntent(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            $appointment = Appointment::with('doctor.user', 'doctor.specialty')
                ->where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$appointment) {
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            if ($appointment->statut !== 'CONFIRME') {
                return response()->json([
                    'error' => 'Vous ne pouvez payer que les rendez-vous confirmés'
                ], 400);
            }

            if ($appointment->est_paye) {
                return response()->json([
                    'error' => 'Ce rendez-vous est déjà payé'
                ], 400);
            }

            // Créer le Payment Intent avec Stripe
            $paymentIntent = $this->stripeService->createPaymentIntent(
                $appointment->prix,
                [
                    'appointment_id' => $appointment->id,
                    'patient_name' => $user->first_name . ' ' . $user->last_name,
                    'doctor_name' => $appointment->doctor->user->first_name . ' ' . $appointment->doctor->user->last_name,
                ]
            );

            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
                'paymentIntentId' => $paymentIntent->id,
                'amount' => $appointment->prix,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la création du paiement',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Confirmer le paiement après succès Stripe
     */


    public function confirmPayment(Request $request, $id)
    {
        \Log::info('=== STEP 1: CONFIRM PAYMENT CALLED ===');
        \Log::info('Appointment ID: ' . $id);
        \Log::info('Payment Intent ID: ' . $request->payment_intent_id);

        try {
            $validator = Validator::make($request->all(), [
                'payment_intent_id' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                \Log::error('STEP 2: Validation failed');
                return response()->json(['errors' => $validator->errors()], 422);
            }

            \Log::info('STEP 2: Validation passed');

            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                \Log::error('STEP 3: Patient not found');
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            \Log::info('STEP 3: Patient found - ID: ' . $patient->id);

            DB::beginTransaction();

            $appointment = Appointment::where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$appointment) {
                \Log::error('STEP 4: Appointment not found');
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            \Log::info('STEP 4: Appointment found');

            if ($appointment->est_paye) {
                \Log::warning('STEP 5: Already paid');
                DB::rollBack();
                return response()->json(['error' => 'Ce rendez-vous est déjà payé'], 400);
            }

            \Log::info('STEP 5: Retrieving payment intent from Stripe');
            $paymentIntent = $this->stripeService->retrievePaymentIntent($request->payment_intent_id);
            \Log::info('STEP 6: Payment intent status: ' . $paymentIntent->status);

            if ($paymentIntent->status !== 'succeeded') {
                \Log::error('STEP 7: Payment not succeeded');
                DB::rollBack();
                return response()->json([
                    'error' => 'Le paiement n\'a pas été confirmé',
                    'status' => $paymentIntent->status
                ], 400);
            }

            \Log::info('STEP 7: Updating appointment');
            $appointment->update([
                'est_paye' => true,
                'paye_par' => 'CARTE'
            ]);
            \Log::info('STEP 8: Appointment updated');

            $payment = null;
            $invoice = null;

            try {
                \Log::info('STEP 9: Creating payment record');
                $payment = Payment::create([
                    'rendez_vous_id' => $appointment->id,
                    'amount' => $appointment->prix,
                    'currency' => 'XOF',
                    'provider' => 'STRIPE',
                    'status' => 'PAYE',
                    'external_reference' => $paymentIntent->id,
                    'provider_response' => [
                        'payment_intent_id' => $paymentIntent->id,
                        'status' => $paymentIntent->status,
                        'amount' => $paymentIntent->amount,
                        'currency' => $paymentIntent->currency,
                    ],
                    'paid_at' => now(),
                ]);
                \Log::info('STEP 10: Payment record created - ID: ' . $payment->id);

                // ✅ UTILISATION DU SERVICE INJECTÉ
                \Log::info('STEP 11: Generating invoice for payment');
                $invoice = $this->invoiceService->generateInvoiceForPayment($payment);
                \Log::info('STEP 12: Invoice generated successfully - Number: ' . $invoice->invoice_number);

            } catch (\Exception $paymentError) {
                \Log::error('Error creating payment/invoice: ' . $paymentError->getMessage());
                \Log::error('Stack trace: ' . $paymentError->getTraceAsString());
                // Ne pas rollback si le paiement est créé mais pas la facture
                // On peut régénérer la facture plus tard
            }

            DB::commit();
            \Log::info('STEP 13: Transaction committed successfully');

            // Recharger l'appointment avec toutes les relations
            $appointment->refresh();
            $appointment->load('doctor.user', 'doctor.specialty', 'invoice');

            return response()->json([
                'message' => 'Paiement confirmé avec succès',
                'appointment' => $appointment,
                'invoice' => $invoice
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('EXCEPTION in confirmPayment: ' . $e->getMessage());
            \Log::error('TRACE: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Erreur lors de la confirmation du paiement',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function payAppointment(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            DB::beginTransaction();

            $appointment = Appointment::where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$appointment) {
                DB::rollBack();
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            if ($appointment->statut !== 'CONFIRME') {
                DB::rollBack();
                return response()->json([
                    'error' => 'Vous ne pouvez payer que les rendez-vous confirmés'
                ], 400);
            }

            if ($appointment->est_paye) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Ce rendez-vous est déjà payé'
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'paye_par' => ['required', 'string', 'in:ESPECES,CARTE,MOBILE_MONEY,VIREMENT']
            ]);

            if ($validator->fails()) {
                DB::rollBack();
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $appointment->update([
                'est_paye' => true,
                'paye_par' => $request->paye_par
            ]);

            // Enregistrer dans payments (pour méthodes non-Stripe)
            Payment::create([
                'rendez_vous_id' => $appointment->id,
                'amount' => $appointment->prix,
                'currency' => 'XOF',
                'provider' => $request->paye_par,
                'status' => 'PAYE',
                'paid_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Paiement effectué avec succès',
                'appointment' => $appointment->load('doctor.user', 'doctor.specialty')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors du paiement',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * ✅ Télécharge la facture d'un rendez-vous
     */
    public function downloadInvoice($id)
    {
        try {


            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                \Log::error('Patient not found');
                return response()->json(['error' => 'Patient non trouvé'], 404);
            }

            \Log::info('Patient found: ' . $patient->id);

            $appointment = Appointment::where('id', $id)
                ->where('patient_id', $patient->id)
                ->with('invoice')
                ->first();

            if (!$appointment) {
                \Log::error('Appointment not found');
                return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
            }

            \Log::info('Appointment found. Has invoice: ' . ($appointment->invoice ? 'Yes' : 'No'));

            if (!$appointment->invoice) {
                \Log::error('No invoice found for appointment');
                return response()->json(['error' => 'Aucune facture disponible pour ce rendez-vous'], 404);
            }

            \Log::info('Invoice found: ' . $appointment->invoice->invoice_number);
            \Log::info('PDF path: ' . $appointment->invoice->pdf_path);

            $filePath = storage_path('app/public/' . $appointment->invoice->pdf_path);
            \Log::info('Full file path: ' . $filePath);

            if (!file_exists($filePath)) {
                \Log::error('Invoice PDF file not found at: ' . $filePath);
                return response()->json(['error' => 'Fichier de facture introuvable'], 404);
            }

            \Log::info('Sending file: ' . $filePath);

            return response()->download(
                $filePath,
                "facture_{$appointment->invoice->invoice_number}.pdf",
                [
                    'Content-Type' => 'application/pdf',
                ]
            );

        } catch (\Exception $e) {
            \Log::error('EXCEPTION in downloadInvoice: ' . $e->getMessage());
            \Log::error('TRACE: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Erreur lors du téléchargement de la facture',
                'details' => $e->getMessage()
            ], 500);
        }
    }}


