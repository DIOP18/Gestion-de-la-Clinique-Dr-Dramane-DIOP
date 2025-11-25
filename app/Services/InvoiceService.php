<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    /**
     * Génère une facture après un paiement réussi
     */
    public function generateInvoiceForPayment(Payment $payment): Invoice
    {
        $appointment = $payment->appointment;

        // Générer un numéro de facture unique
        $invoiceNumber = $this->generateInvoiceNumber();

        // Créer l'enregistrement de la facture
        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'rendez_vous_id' => $appointment->id,
            'payment_id' => $payment->id,
            'total_amount' => $payment->amount,
            'currency' => $payment->currency,
            'issued_at' => now(),
        ]);

        // Générer le PDF
        $pdfPath = $this->generatePDF($invoice);

        // Mettre à jour le chemin du PDF
        $invoice->update(['pdf_path' => $pdfPath]);

        return $invoice;
    }

    /**
     * Génère un numéro de facture unique
     */
    private function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        $count = Invoice::whereDate('created_at', today())->count() + 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $count);
    }

    /**
     * Génère le fichier PDF de la facture
     */
    private function generatePDF(Invoice $invoice): string
    {
        $appointment = $invoice->appointment->load('patient.user', 'doctor.user', 'doctor.specialty');
        $payment = $invoice->payment;

        $data = [
            'invoice' => $invoice,
            'appointment' => $appointment,
            'payment' => $payment,
            'patient' => $appointment->patient,
            'doctor' => $appointment->doctor,
        ];

        $pdf = Pdf::loadView('invoices.template', $data);

        // Définir le chemin de stockage
        $filename = "invoice_{$invoice->invoice_number}.pdf";
        $path = "invoices/{$filename}";

        // Sauvegarder le PDF
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    /**
     * Récupère le chemin complet du PDF
     */
    public function getInvoicePdfUrl(Invoice $invoice): string
    {
        return Storage::disk('public')->url($invoice->pdf_path);
    }
}
