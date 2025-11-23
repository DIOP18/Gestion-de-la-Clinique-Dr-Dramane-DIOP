<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Exception;

class StripePaymentService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Créer un Payment Intent
     *
     * @param float $amount Montant en FCFA
     * @param array $metadata Métadonnées additionnelles
     * @return PaymentIntent
     * @throws Exception
     */
    public function createPaymentIntent(float $amount, array $metadata = []): PaymentIntent
    {
        try {
            // Stripe utilise les centimes, donc multiplier par 100
            $amountInCents = (int)($amount * 100);

            return PaymentIntent::create([
                'amount' => $amountInCents,
                'currency' => 'xof', // Franc CFA (XOF)
                'metadata' => $metadata,
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);
        } catch (Exception $e) {
            throw new Exception("Erreur lors de la création du paiement: " . $e->getMessage());
        }
    }

    /**
     * Confirmer un paiement
     *
     * @param string $paymentIntentId
     * @return PaymentIntent
     * @throws Exception
     */
    public function confirmPayment(string $paymentIntentId): PaymentIntent
    {
        try {
            return PaymentIntent::retrieve($paymentIntentId);
        } catch (Exception $e) {
            throw new Exception("Erreur lors de la confirmation du paiement: " . $e->getMessage());
        }
    }

    /**
     * Récupérer un Payment Intent
     *
     * @param string $paymentIntentId
     * @return PaymentIntent
     * @throws Exception
     */
    public function retrievePaymentIntent(string $paymentIntentId): PaymentIntent
    {
        try {
            return PaymentIntent::retrieve($paymentIntentId);
        } catch (Exception $e) {
            throw new Exception("Erreur lors de la récupération du paiement: " . $e->getMessage());
        }
    }
}
