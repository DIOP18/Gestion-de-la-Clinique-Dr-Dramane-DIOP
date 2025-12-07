<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Assistant - {{ $date }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .header {
            background: #1565c0;
            color: white;
            padding: 25px;
            text-align: center;
            margin-bottom: 25px;
            border-radius: 8px;
        }
        .header h1 {
            font-size: 22px;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 12px;
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #1565c0;
            font-size: 15px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #1565c0;
        }
        .stats-row {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        .stat-item {
            display: table-cell;
            width: 25%;
            padding: 10px;
            text-align: center;
        }
        .stat-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #1565c0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            background: white;
        }
        table th {
            background: #1565c0;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
        }
        table td {
            padding: 7px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 10px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
        }
        .badge-confirme { background: #1565c0; color: white; }
        .badge-attente { background: #fbbf24; color: white; }
        .badge-complete { background: #10b981; color: white; }
        .badge-annule { background: #ef4444; color: white; }
        .badge-paye { background: #10b981; color: white; }
        .badge-impaye { background: #ef4444; color: white; }
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9px;
            color: #999;
            padding: 12px;
            border-top: 1px solid #e0e0e0;
        }
        h1 {
            font-size: 32px;
            text-align: center;
            font-weight: 800;
            margin-bottom: 25px;
            color: #1a237e;
            background: linear-gradient(90deg, #1565c0, #1a237e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 0 3px 8px rgba(21, 101, 192, 0.2);
        }
    </style>
</head>
<body>
    <h1>MES statistiques assistant</h1>

<div class="section">
    <h2>Vue d'ensemble du jour</h2>
    <div class="stats-row">
        <div class="stat-item">
            <div class="stat-label">Total RDV</div>
            <div class="stat-value">{{ $overview['total_appointments_today'] ?? 0 }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Confirmés</div>
            <div class="stat-value">{{ $overview['confirmed_today'] ?? 0 }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Complétés</div>
            <div class="stat-value">{{ $overview['completed_today'] ?? 0 }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Annulés</div>
            <div class="stat-value">{{ $overview['canceled_today'] ?? 0 }}</div>
        </div>
    </div>
    <div class="stats-row">
        <div class="stat-item">
            <div class="stat-label">Payés</div>
            <div class="stat-value">{{ $overview['paid_today'] ?? 0 }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Non Payés</div>
            <div class="stat-value">{{ $overview['unpaid_today'] ?? 0 }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Médecins Actifs</div>
            <div class="stat-value">{{ $overview['active_doctors_today'] ?? 0 }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Revenus</div>
            <div class="stat-value">{{ number_format($overview['total_revenue_today'] ?? 0) }} XOF</div>
        </div>
    </div>
</div>

<!-- FLUX DES STATUTS -->
<div class="section">
    <h2>Flux des rendez-vous</h2>
    <table style="width: 100%;">
        <tr>
            @foreach($funnelData as $step)
                <td style="width: 33%; text-align: center; padding: 12px; border: 2px solid #3b82f6;">
                    <div style="font-size: 10px; color: #666; margin-bottom: 4px;">{{ $step['label'] }}</div>
                    <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">{{ $step['value'] }}</div>
                </td>
            @endforeach
        </tr>
    </table>
</div>

<!-- STATISTIQUES PAIEMENT -->
<div class="section">
    <h2>Répartition des paiements</h2>
    <table style="width: 60%; margin: 0 auto;">
        <tr>
            @foreach($paymentStats as $stat)
                <td style="width: 50%; text-align: center; padding: 12px; border: 2px solid {{ $stat['label'] == 'Payés' ? '#10b981' : '#ef4444' }};">
                    <div style="font-size: 10px; color: #666; margin-bottom: 4px;">{{ $stat['label'] }}</div>
                    <div style="font-size: 18px; font-weight: bold; color: {{ $stat['label'] == 'Payés' ? '#10b981' : '#ef4444' }};">
                        {{ $stat['value'] }}
                    </div>
                </td>
            @endforeach
        </tr>
    </table>
</div>

<!-- TOUS LES RENDEZ-VOUS DU JOUR -->
<div class="section">
    <h2>Planning complet du jour ({{ count($ganttData) }} rendez-vous)</h2>
    @if(count($ganttData) > 0)
        <table>
            <thead>
            <tr>
                <th>Heure</th>
                <th>Médecin</th>
                <th>Patient</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Paiement</th>
            </tr>
            </thead>
            <tbody>
            @foreach($ganttData as $apt)
                <tr>
                    <td><strong>{{ $apt['heure_debut'] }} - {{ $apt['heure_fin'] }}</strong></td>
                    <td>{{ $apt['doctor_name'] }}<br><small style="color: #666;">{{ $apt['specialty'] }}</small></td>
                    <td>{{ $apt['patient_name'] }}<br><small style="color: #666;">{{ $apt['patient_phone'] }}</small></td>
                    <td>{{ $apt['motif'] }}</td>
                    <td>
                        @if($apt['statut'] == 'CONFIRME')
                            <span class="badge badge-confirme">CONFIRMÉ</span>
                        @elseif($apt['statut'] == 'EN ATTENTE')
                            <span class="badge badge-attente">EN ATTENTE</span>
                        @elseif($apt['statut'] == 'COMPLETE')
                            <span class="badge badge-complete">COMPLÉTÉ</span>
                        @elseif($apt['statut'] == 'ANNULE')
                            <span class="badge badge-annule">ANNULÉ</span>
                        @endif
                    </td>
                    <td>
                        @if($apt['est_paye'])
                            <span class="badge badge-paye">PAYÉ</span>
                        @else
                            <span class="badge badge-impaye">NON PAYÉ</span>
                        @endif
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    @else
        <p style="text-align: center; padding: 20px; color: #999;">Aucun rendez-vous prévu</p>
    @endif
</div>

<!-- MOTIFS LES PLUS FRÉQUENTS -->
@if(count($motivesStats) > 0)
    <div class="section">
        <h2>Motifs de consultation les plus fréquents</h2>
        <table style="width: 70%; margin: 0 auto;">
            <thead>
            <tr>
                <th>Motif</th>
                <th>Nombre</th>
            </tr>
            </thead>
            <tbody>
            @foreach($motivesStats as $motive)
                <tr>
                    <td>{{ $motive['label'] }}</td>
                    <td><strong>{{ $motive['value'] }}</strong></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endif

<div class="footer">
    <p>&copy; {{ date('Y') }} - Clinique Dr DRAMANE DIOP</p>
    <p>Rapport confidentiel - Usage interne uniquement</p>
</div>
</body>
</html>
