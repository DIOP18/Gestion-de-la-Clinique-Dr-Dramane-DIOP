<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Payment;

/**
 * PayDunya integration service stub.
 * Requires composer package: paydunya/paydunya-php (or official SDK) and credentials.
 */
class PayDunyaService
{
    public function __construct()
    {
        // TODO: initialize PayDunya configuration from env
    }

    /**
     * Create a checkout invoice for an appointment and return a redirect URL.
     */
    public function createCheckout(Appointment $appointment): Payment
    {
        // 1) Create local payment record with PENDING status
        $payment = Payment::create([
            'rendez_vous_id' => $appointment->id,
            'amount' => $appointment->prix,
            'currency' => 'XOF',
            'provider' => 'PAYDUNYA',
            'status' => 'PENDING',
        ]);

        // 2) Call PayDunya API to create invoice and capture reference + redirect url (stub)
        // $redirectUrl = '...'; $reference = '...';

        // $payment->external_reference = $reference;
        // $payment->provider_response = ['redirect_url' => $redirectUrl];
        // $payment->save();

        return $payment;
    }

    /**
     * Handle PayDunya IPN/Callbacks to update payment status.
     */
    public function handleCallback(array $payload): void
    {
        // Implement signature verification and status updates
    }
}


