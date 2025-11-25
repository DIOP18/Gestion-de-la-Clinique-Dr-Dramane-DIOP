<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Administrateur - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            color: #111;
            line-height: 1.5;
            padding: 30px;
            background: linear-gradient(135deg, #f4f7fb 0%, #e6eefb 100%);
        }

        .container {
            max-width: 100%;
            background: white;
            padding: 0;
        }

        /* Header */
        .header {
            background: linear-gradient(90deg, #1565c0, #1a237e);
            color: white;
            padding: 35px 30px;
            text-align: center;
            margin-bottom: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(26, 35, 126, 0.2);
        }

        .header h1 {
            font-size: 26px;
            margin-bottom: 12px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .header .subtitle {
            font-size: 13px;
            opacity: 0.95;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .header .period {
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            display: inline-block;
        }

        .header .generated {
            font-size: 11px;
            margin-top: 10px;
            opacity: 0.85;
        }

        /* Section */
        .section {
            margin-bottom: 20px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            page-break-inside: avoid;
        }

        .section-title {
            color: #1a237e;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1565c0;
        }

        /* Stats Grid */
        .stats-grid {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px;
        }

        .stats-row {
            display: table-row;
        }

        .stat-card {
            display: table-cell;
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            width: 33.33%;
            vertical-align: top;
        }

        .stat-label {
            font-size: 9px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .stat-value {
            font-size: 22px;
            font-weight: 800;
            color: #1565c0;
            margin-top: 4px;
        }

        .stat-card.primary .stat-value { color: #1565c0; }
        .stat-card.success .stat-value { color: #10b981; }
        .stat-card.info .stat-value { color: #3b82f6; }
        .stat-card.revenue .stat-value { color: #8b5cf6; }
        .stat-card.danger .stat-value { color: #ef4444; }

        /* Journey Steps */
        .journey-grid {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px;
            margin-top: 10px;
        }

        .journey-row {
            display: table-row;
        }

        .journey-step {
            display: table-cell;
            background: #f9fafb;
            padding: 18px 12px;
            border: 2px solid #1565c0;
            border-radius: 8px;
            text-align: center;
            width: 25%;
            vertical-align: middle;
        }

        .journey-step .step-label {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .journey-step .step-value {
            font-size: 24px;
            font-weight: 800;
            color: #1565c0;
        }

        /* Table */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            background: white;
        }

        table.data-table thead {
            background: linear-gradient(90deg, #1565c0, #1a237e);
        }

        table.data-table th {
            color: white;
            padding: 12px 14px;
            text-align: left;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }

        table.data-table td {
            padding: 10px 14px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
            color: #374151;
        }

        table.data-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        table.data-table tbody tr:last-child td {
            border-bottom: none;
        }

        table.data-table td strong {
            color: #111;
            font-weight: 700;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 30px;
            color: #9ca3af;
            font-size: 12px;
            font-style: italic;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding: 20px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 2px solid #e5e7eb;
            background: white;
            border-radius: 12px;
        }

        .footer p {
            margin: 4px 0;
        }

        .footer .clinic-name {
            font-weight: 700;
            color: #1a237e;
            font-size: 11px;
            margin-bottom: 6px;
        }

        /* Highlight Box */
        .highlight-box {
            background: linear-gradient(135deg, rgba(21, 101, 192, 0.08), rgba(21, 101, 192, 0.02));
            border-left: 4px solid #1565c0;
            padding: 12px 16px;
            margin: 12px 0;
            border-radius: 6px;
        }

        .highlight-box .label {
            font-size: 10px;
            color: #6b7280;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .highlight-box .value {
            font-size: 20px;
            color: #1565c0;
            font-weight: 800;
        }

        /* Page Break */
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
<!-- HEADER -->
<div class="header">
    <h1>Rapport Administrateur</h1>
    <p class="subtitle">Vue d'ensemble des rendez-vous de la clinique</p>
    <div class="period">
        📅 Période : {{ $period['start'] }} - {{ $period['end'] }}
    </div>
    <p class="generated">Généré le {{ $generated_at }}</p>
</div>

<!-- VUE D'ENSEMBLE -->
<div class="section">
    <h2 class="section-title">Vue d'Ensemble</h2>

    <table class="stats-grid">
        <tr class="stats-row">
            <td class="stat-card primary">
                <div class="stat-label">Total Patients</div>
                <div class="stat-value">{{ number_format($overview['total_patients'] ?? 0) }}</div>
            </td>
            <td class="stat-card success">
                <div class="stat-label">Nouveaux Patients</div>
                <div class="stat-value">{{ number_format($overview['new_patients'] ?? 0) }}</div>
            </td>
            <td class="stat-card info">
                <div class="stat-label">Patients Fidèles</div>
                <div class="stat-value">{{ number_format($overview['loyal_patients'] ?? 0) }}</div>
            </td>
        </tr>
        <tr class="stats-row">
            <td class="stat-card info">
                <div class="stat-label">Total Médecins</div>
                <div class="stat-value">{{ number_format($overview['total_doctors'] ?? 0) }}</div>
            </td>
            <td class="stat-card info">
                <div class="stat-label">Total Assistants</div>
                <div class="stat-value">{{ number_format($overview['total_assistants'] ?? 0) }}</div>
            </td>
            <td class="stat-card primary">
                <div class="stat-label">RDV Aujourd'hui</div>
                <div class="stat-value">{{ number_format($overview['appointments_today'] ?? 0) }}</div>
            </td>
        </tr>
        <tr class="stats-row">
            <td class="stat-card success">
                <div class="stat-label">RDV Confirmés</div>
                <div class="stat-value">{{ number_format($overview['appointments_confirmed'] ?? 0) }}</div>
            </td>
            <td class="stat-card primary">
                <div class="stat-label">Total RDV</div>
                <div class="stat-value">{{ number_format($overview['total_appointments'] ?? 0) }}</div>
            </td>
            <td class="stat-card danger">
                <div class="stat-label">Taux d'Annulation</div>
                <div class="stat-value">{{ number_format($overview['cancellation_rate'] ?? 0, 1) }}%</div>
            </td>
        </tr>
    </table>

    <!-- Revenue Highlight -->
    <div class="highlight-box" style="margin-top: 15px;">
        <div class="label">Revenus Total (Période)</div>
        <div class="value">{{ number_format($overview['total_revenue'] ?? 0) }} FCFA</div>
    </div>
</div>

<!-- PARCOURS PATIENT -->
<div class="section">
    <h2 class="section-title">Parcours Patient - Flux de Fidélisation</h2>

    <table class="journey-grid">
        <tr class="journey-row">
            <td class="journey-step">
                <div class="step-label">Nouveaux Patients</div>
                <div class="step-value">{{ number_format($patientJourney['new_patients'] ?? 0) }}</div>
            </td>
            <td class="journey-step">
                <div class="step-label">1ère Consultation</div>
                <div class="step-value">{{ number_format($patientJourney['first_consultation'] ?? 0) }}</div>
            </td>
            <td class="journey-step">
                <div class="step-label">Suivi</div>
                <div class="step-value">{{ number_format($patientJourney['follow_up'] ?? 0) }}</div>
            </td>
            <td class="journey-step">
                <div class="step-label">Fidélisés (2+ RDV)</div>
                <div class="step-value">{{ number_format($patientJourney['loyal_patients'] ?? 0) }}</div>
            </td>
        </tr>
    </table>
</div>

<!-- STATISTIQUES PAR SPÉCIALITÉ -->
<div class="section">
    <h2 class="section-title">Statistiques par Spécialité</h2>

    <table class="data-table">
        <thead>
        <tr>
            <th>SPÉCIALITÉ</th>
            <th>MÉDECINS</th>
            <th>RENDEZ-VOUS</th>
            <th>PRIX CONSULTATION</th>
            <th>REVENUS (FCFA)</th>
        </tr>
        </thead>
        <tbody>
        @if(isset($specialtyStats) && count($specialtyStats) > 0)
            @foreach($specialtyStats as $spec)
                <tr>
                    <td><strong>{{ $spec['label'] ?? 'N/A' }}</strong></td>
                    <td>{{ $spec['doctor_count'] ?? 0 }}</td>
                    <td>{{ number_format($spec['total_appointments'] ?? 0) }}</td>
                    <td>{{ number_format($spec['prix'] ?? 0) }} FCFA</td>
                    <td><strong>{{ number_format($spec['revenue'] ?? 0) }} FCFA</strong></td>
                </tr>
            @endforeach

            <!-- Total Row -->
            <tr style="background: #f1f5f9; font-weight: 700;">
                <td><strong>TOTAL</strong></td>
                <td>{{ array_sum(array_column($specialtyStats, 'doctor_count')) }}</td>
                <td>{{ number_format(array_sum(array_column($specialtyStats, 'total_appointments'))) }}</td>
                <td>-</td>
                <td><strong>{{ number_format(array_sum(array_column($specialtyStats, 'revenue'))) }} FCFA</strong></td>
            </tr>
        @else
            <tr>
                <td colspan="5" class="empty-state">
                    Aucune donnée disponible pour cette période
                </td>
            </tr>
        @endif
        </tbody>
    </table>
</div>

<!-- PAGE BREAK -->
<div class="page-break"></div>

<!-- RENDEZ-VOUS PAR JOUR -->
<div class="section">
    <h2 class="section-title">Rendez-vous par Jour (20 derniers jours)</h2>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 30%;">DATE</th>
            <th style="width: 70%;">NOMBRE DE RENDEZ-VOUS</th>
        </tr>
        </thead>
        <tbody>
        @if(isset($appointmentsByDay) && count($appointmentsByDay) > 0)
            @php
                $total = 0;
                $days = array_slice($appointmentsByDay, 0, 20);
            @endphp

            @foreach($days as $day)
                @php $total += $day['count'] ?? 0; @endphp
                <tr>
                    <td>{{ $day['date_formatted'] ?? 'N/A' }}</td>
                    <td>
                        <strong>{{ $day['count'] ?? 0 }}</strong>
                        <span style="color: #6b7280; margin-left: 10px;">
                                    {{ str_repeat('█', min($day['count'] ?? 0, 20)) }}
                                </span>
                    </td>
                </tr>
            @endforeach

            <!-- Average Row -->
            <tr style="background: #f1f5f9; font-weight: 700;">
                <td><strong>MOYENNE PAR JOUR</strong></td>
                <td><strong>{{ count($days) > 0 ? number_format($total / count($days), 1) : 0 }}</strong></td>
            </tr>
        @else
            <tr>
                <td colspan="2" class="empty-state">
                    Aucune donnée disponible pour cette période
                </td>
            </tr>
        @endif
        </tbody>
    </table>
</div>

<!-- RÉSUMÉ FINAL -->
<div class="section">
    <h2 class="section-title">Résumé des Indicateurs Clés</h2>

    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; padding: 10px; vertical-align: top;">
                <div class="highlight-box">
                    <div class="label">Taux de Confirmation</div>
                    <div class="value">
                        @php
                            $total = $overview['total_appointments'] ?? 0;
                            $confirmed = $overview['appointments_confirmed'] ?? 0;
                            $rate = $total > 0 ? ($confirmed / $total) * 100 : 0;
                        @endphp
                        {{ number_format($rate, 1) }}%
                    </div>
                </div>
            </td>
            <td style="width: 50%; padding: 10px; vertical-align: top;">
                <div class="highlight-box">
                    <div class="label">Revenu Moyen par RDV</div>
                    <div class="value">
                        @php
                            $total = $overview['total_appointments'] ?? 0;
                            $revenue = $overview['total_revenue'] ?? 0;
                            $avg = $total > 0 ? $revenue / $total : 0;
                        @endphp
                        {{ number_format($avg, 0) }} FCFA
                    </div>
                </div>
            </td>
        </tr>
    </table>
</div>

<!-- FOOTER -->
<div class="footer">
    <p class="clinic-name">Clinique Dr DRAMANE DIOP</p>
    <p>{{ $filter_label ?? 'Période personnalisée' }}</p>
    <p style="margin-top: 8px;">&copy; {{ date('Y') }} - Tous droits réservés</p>
    <p style="color: #ef4444; font-weight: 600; margin-top: 6px;">Document confidentiel - Usage interne uniquement</p>
</div>
</body>
</html>
