<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Administrateur</title>
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
            background: #1a237e;
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 13px;
        }
        .section {
            margin-bottom: 25px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #1a237e;
            font-size: 16px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #1a237e;
        }
        .stats-grid {
            display: table;
            width: 100%;
            margin-top: 15px;
        }
        .stat-row {
            display: table-row;
        }
        .stat-card {
            display: table-cell;
            background: white;
            padding: 12px;
            margin: 5px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            width: 33%;
        }
        .stat-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1a237e;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
        }
        table th {
            background: #1a237e;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
        }
        table td {
            padding: 8px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 11px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
            padding: 15px;
            border-top: 1px solid #e0e0e0;
        }
        .journey-container {
            display: table;
            width: 100%;
            margin-top: 15px;
        }
        .journey-step {
            display: table-cell;
            background: white;
            padding: 15px;
            margin: 5px;
            border: 2px solid #1a237e;
            border-radius: 6px;
            text-align: center;
            width: 25%;
        }
        .journey-step h4 {
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
        }
        .journey-step p {
            font-size: 20px;
            font-weight: bold;
            color: #1a237e;
        }
    </style>
</head>
<body>
<div class="header">
    <h1>Rapport Administrateur</h1>
    <p>Période : {{ $period['start'] }} - {{ $period['end'] }}</p>
    <p>{{ $filter_label ?? 'Période personnalisée' }}</p>
    <p style="margin-top: 10px;">Généré le {{ $generated_at }}</p>
</div>

<!-- STATISTIQUES GÉNÉRALES -->
<div class="section">
    <h2>Vue d'ensemble</h2>
    <table style="width: 100%;">
        <tr>
            <td style="width: 33%; padding: 10px;">
                <div class="stat-label">Total Patients</div>
                <div class="stat-value">{{ number_format($overview['total_patients'] ?? 0) }}</div>
            </td>
            <td style="width: 33%; padding: 10px;">
                <div class="stat-label">Nouveaux Patients</div>
                <div class="stat-value">{{ number_format($overview['new_patients'] ?? 0) }}</div>
            </td>
            <td style="width: 33%; padding: 10px;">
                <div class="stat-label">Patients Fidèles</div>
                <div class="stat-value">{{ number_format($overview['loyal_patients'] ?? 0) }}</div>
            </td>
        </tr>
        <tr>
            <td style="padding: 10px;">
                <div class="stat-label">Total Médecins</div>
                <div class="stat-value">{{ number_format($overview['total_doctors'] ?? 0) }}</div>
            </td>
            <td style="padding: 10px;">
                <div class="stat-label">Total Assistants</div>
                <div class="stat-value">{{ number_format($overview['total_assistants'] ?? 0) }}</div>
            </td>
            <td style="padding: 10px;">
                <div class="stat-label">RDV Aujourd'hui</div>
                <div class="stat-value">{{ number_format($overview['appointments_today'] ?? 0) }}</div>
            </td>
        </tr>
        <tr>
            <td style="padding: 10px;">
                <div class="stat-label">RDV Confirmés</div>
                <div class="stat-value">{{ number_format($overview['appointments_confirmed'] ?? 0) }}</div>
            </td>
            <td style="padding: 10px;">
                <div class="stat-label">Total RDV</div>
                <div class="stat-value">{{ number_format($overview['total_appointments'] ?? 0) }}</div>
            </td>
            <td style="padding: 10px;">
                <div class="stat-label">Revenus Total</div>
                <div class="stat-value">{{ number_format($overview['total_revenue'] ?? 0) }} XOF</div>
            </td>
        </tr>
    </table>
</div>

<!-- PARCOURS PATIENT -->
<div class="section">
    <h2>Parcours Patient</h2>
    <table style="width: 100%;">
        <tr>
            <td style="width: 25%; text-align: center; padding: 15px; border: 2px solid #667eea;">
                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Nouveaux Patients</div>
                <div style="font-size: 20px; font-weight: bold; color: #667eea;">
                    {{ number_format($patientJourney['new_patients'] ?? 0) }}
                </div>
            </td>
            <td style="width: 25%; text-align: center; padding: 15px; border: 2px solid #667eea;">
                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">1ère Consultation</div>
                <div style="font-size: 20px; font-weight: bold; color: #667eea;">
                    {{ number_format($patientJourney['first_consultation'] ?? 0) }}
                </div>
            </td>
            <td style="width: 25%; text-align: center; padding: 15px; border: 2px solid #667eea;">
                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Suivi</div>
                <div style="font-size: 20px; font-weight: bold; color: #667eea;">
                    {{ number_format($patientJourney['follow_up'] ?? 0) }}
                </div>
            </td>
            <td style="width: 25%; text-align: center; padding: 15px; border: 2px solid #667eea;">
                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Fidélisés (2+ RDV)</div>
                <div style="font-size: 20px; font-weight: bold; color: #667eea;">
                    {{ number_format($patientJourney['loyal_patients'] ?? 0) }}
                </div>
            </td>
        </tr>
    </table>
</div>

<!-- STATISTIQUES PAR SPÉCIALITÉ -->
<div class="section">
    <h2>Statistiques par Spécialité</h2>
    <table>
        <thead>
        <tr>
            <th>Spécialité</th>
            <th>Médecins</th>
            <th>Rendez-vous</th>
            <th>Revenus (XOF)</th>
            <th>Prix Consultation</th>
        </tr>
        </thead>
        <tbody>
        @if(isset($specialtyStats) && count($specialtyStats) > 0)
            @foreach($specialtyStats as $spec)
                <tr>
                    <td><strong>{{ $spec['label'] ?? 'N/A' }}</strong></td>
                    <td>{{ $spec['doctor_count'] ?? 0 }}</td>
                    <td>{{ number_format($spec['total_appointments'] ?? 0) }}</td>
                    <td>{{ number_format($spec['revenue'] ?? 0) }}</td>
                    <td>{{ number_format($spec['prix'] ?? 0) }}</td>
                </tr>
            @endforeach
        @else
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                    Aucune donnée disponible
                </td>
            </tr>
        @endif
        </tbody>
    </table>
</div>

<!-- RENDEZ-VOUS PAR JOUR -->
<div class="section">
    <h2>Rendez-vous par Jour (15 derniers jours)</h2>
    <table>
        <thead>
        <tr>
            <th>Date</th>
            <th>Nombre de Rendez-vous</th>
        </tr>
        </thead>
        <tbody>
        @if(isset($appointmentsByDay) && count($appointmentsByDay) > 0)
            @foreach(array_slice($appointmentsByDay, 0, 15) as $day)
                <tr>
                    <td>{{ $day['date_formatted'] ?? 'N/A' }}</td>
                    <td><strong>{{ $day['count'] ?? 0 }}</strong></td>
                </tr>
            @endforeach
        @else
            <tr>
                <td colspan="2" style="text-align: center; padding: 20px; color: #999;">
                    Aucune donnée disponible
                </td>
            </tr>
        @endif
        </tbody>
    </table>
</div>

<div class="footer">
    <p>&copy; {{ date('Y') }} - Clinique Dr DRAMANE DIOP </p>
    <p>Document confidentiel - Usage interne uniquement</p>
</div>
</body>
</html>
