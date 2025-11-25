<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 5px;
        }
        .invoice-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .invoice-info table {
            width: 100%;
        }
        .invoice-info td {
            padding: 5px;
        }
        .invoice-info .label {
            font-weight: bold;
            color: #1f2937;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #2563eb;
            color: white;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            font-weight: bold;
            padding: 8px;
            width: 40%;
            background: #f9fafb;
        }
        .info-value {
            display: table-cell;
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .payment-summary {
            background: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .total-amount {
            text-align: right;
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-weight: bold;
            font-size: 11px;
        }
    </style>
</head>
<body>
<div class="header">
    <h1>Clinique Dr Dramane DIOP </h1>
    <p style="font-size: 14px; color: #6b7280;">N° {{ $invoice->invoice_number }}</p>
    <p style="font-size: 11px; color: #6b7280;">Émise le {{ $invoice->issued_at->format('d/m/Y à H:i') }}</p>
</div>

<div class="invoice-info">
    <table>
        <tr>
            <td style="width: 50%; vertical-align: top;">

                <div class="label">INFORMATIONS PATIENT</div>
                <div><strong>{{ $patient->user->first_name }} {{ $patient->user->lest_name }}</strong></div>
                <div>{{ $patient->user->email }}</div>
                <div>{{ $patient->user->phone }}</div>
                @if($patient->user->address)
                    <div>{{ $patient->user->address }}</div>
                @endif
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
                <div class="label">INFORMATIONS MÉDECIN</div>
                <div><strong>Dr. {{ $doctor->user->first_name }} {{ $doctor->user->lest_name }}</strong></div>
                <div>{{ $doctor->specialty->label ?? 'N/A' }}</div>
                <div>{{ $doctor->user->phone }}</div>
            </td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">DÉTAILS DU RENDEZ-VOUS</div>
    <div class="info-grid">
        <div class="info-row">
            <div class="info-label">Date du rendez-vous</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($appointment->date)->format('d/m/Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Heure</div>
            <div class="info-value">{{ $appointment->debut_at }} - {{ $appointment->fin_at }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Motif de consultation</div>
            <div class="info-value">{{ $appointment->motif }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Statut</div>
            <div class="info-value">
                <span class="status-badge">{{ $appointment->statut }}</span>
            </div>
        </div>
    </div>
</div>

<div class="section">
    <div class="section-title">DÉTAILS DU PAIEMENT</div>
    <div class="info-grid">
        <div class="info-row">
            <div class="info-label">Méthode de paiement</div>
            <div class="info-value">{{ $payment->provider }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Référence de transaction</div>
            <div class="info-value">{{ $payment->external_reference }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Date de paiement</div>
            <div class="info-value">{{ $payment->paid_at->format('d/m/Y à H:i') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Statut du paiement</div>
            <div class="info-value">
                <span class="status-badge">{{ $payment->status }}</span>
            </div>
        </div>
    </div>
</div>

<div class="payment-summary">
    <table style="width: 100%;">
        <tr>
            <td style="padding: 10px;"><strong>Description</strong></td>
            <td style="text-align: right; padding: 10px;"><strong>Montant</strong></td>
        </tr>
        <tr>
            <td style="padding: 10px; border-top: 1px solid #bfdbfe;">Consultation médicale</td>
            <td style="text-align: right; padding: 10px; border-top: 1px solid #bfdbfe;">
                {{ number_format($invoice->total_amount, 0, ',', ' ') }} {{ $invoice->currency }}
            </td>
        </tr>
    </table>
    <div class="total-amount">
        TOTAL: {{ number_format($invoice->total_amount, 0, ',', ' ') }} {{ $invoice->currency }}
    </div>
</div>

<div class="footer">
    <p><strong>Merci pour votre confiance!</strong></p>
    <p>Cette facture est générée automatiquement et certifie le paiement de votre rendez.</p>
    <p style="margin-top: 10px;">Veuillez vous munir de cette facture lors de votre rendez-vous.</p>
</div>
</body>
</html>
