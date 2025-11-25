<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Services\InvoiceService;
use Illuminate\Console\Command;

class GenerateMissingInvoices extends Command
{
    protected $signature = 'invoices:generate-missing';
    protected $description = 'Génère les factures manquantes pour les paiements existants';

    public function handle(InvoiceService $invoiceService)
    {
        $this->info('Recherche des paiements sans facture...');

        $paymentsWithoutInvoice = Payment::whereDoesntHave('invoice')
            ->where('status', 'PAYE')
            ->get();

        if ($paymentsWithoutInvoice->isEmpty()) {
            $this->info('Aucune facture manquante trouvée.');
            return 0;
        }

        $this->info("Génération de {$paymentsWithoutInvoice->count()} facture(s)...");

        $bar = $this->output->createProgressBar($paymentsWithoutInvoice->count());
        $bar->start();

        foreach ($paymentsWithoutInvoice as $payment) {
            try {
                $invoice = $invoiceService->generateInvoiceForPayment($payment);
                $this->newLine();
                $this->info("✓ Facture générée: {$invoice->invoice_number}");
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("✗ Erreur pour le paiement #{$payment->id}: " . $e->getMessage());
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Génération terminée !');

        return 0;
    }
}
