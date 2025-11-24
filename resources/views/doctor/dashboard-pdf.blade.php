<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Médecin - {{ $doctor_name }}</title>
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
            background: linear-gradient(135deg, #1a237e 0%, #1565c0 100%);
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
            color: #1a237e;
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
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9px;
            color: #999;
            padding: 12px;
            border-top: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
<div class="header">
    <h1>Rapport Dashboard Médecin</h1>
    <p>Dr. {{ $doctor_name }} - {{ $specialty }}</p>
    <p>Période: {{ $period['start'] }} - {{ $period['end'] }} ({{ $filter_label }})</p>
    <p style="margin-top: 8px;">Généré le {{ $generated_at }}</p>
</div>

<!-- STATISTIQUES GÉNÉRALES -->
<div class="section">
    <h2>Vue d'ensemble</h2>
    <div class="stats-row">
        <div class="stat-item">
            <div class="stat-label">Total Patients</div>
            <div class="stat-value">{{ number_format($overview['total_patients'] ?? 0) }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total RDV</div>
            <div class="stat-value">{{ number_format($overview['total_appointments'] ?? 0) }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">RDV Confirmés</div>
            <div class="stat-value">{{ number_format($overview['confirmed_appointments'] ?? 0) }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">RDV Complétés</div>
            <div class="stat-value">{{ number_format($overview['completed_appointments'] ?? 0) }}</div>
        </div>
    </div>
    <div class="stats-row">
        <div class="stat-item">
            <div class="stat-label">Annulés</div>
            <div class="stat-value">{{ number_format($overview['canceled_appointments'] ?? 0) }}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Taux Annulation</div>
            <div class="stat-value">{{ number_format($overview['cancellation_rate'] ?? 0, 2) }}%</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Durée Moyenne</div>
            <div class="stat-value">{{ number_format($overview['avg_duration'] ?? 0) }} min</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Revenus</div>
            <div class="stat-value">{{ number_format($overview['total_revenue'] ?? 0) }} XOF</div>
        </div>
    </div>
</div>

<!-- RÉPARTITION DU TEMPS -->
<div class="section">
    <h2>Répartition des Rendez-vous par Statut</h2>
    <table style="width: 80%; margin: 0 auto;">
        <thead>
        <tr>
            <th>Statut</th>
            <th style="text-align: center;">Nombre</th>
            <th style="text-align: right;">Pourcentage</th>
        </tr>
        </thead>
        <tbody>
        @php
$timeDistribution = [];
$total = array_sum(array_column($timeDistribution, 'value'));
        @endphp
        @foreach($timeDistribution as $item)
            <tr>
                <td><strong>{{ $item['label'] }}</strong></td>
                <td style="text-align: center;">{{ $item['value'] }}</td>
                <td style="text-align: right;">
                    {{ $total > 0 ? number_format(($item['value'] / $total) * 100, 1) : 0 }}%
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
</div>

<!-- REVENUS PAR MOIS -->
@if(count($revenueByMonth) > 0)
    <div class="section">
        <h2>Revenus par Mois</h2>
        <table>
            <thead>
            <tr>
                <th>Mois</th>
                <th>Nombre de RDV</th>
                <th>Revenus (XOF)</th>
            </tr>
            </thead>
            <tbody>
            @foreach($revenueByMonth as $month)
                <tr>
                    <td><strong>{{ $month['month_formatted'] }}</strong></td>
                    <td>{{ number_format($month['count']) }}</td>
                    <td><strong>{{ number_format($month['revenue']) }} XOF</strong></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endif

<!-- RENDEZ-VOUS PAR JOUR (Top 15) -->
@if(count($appointmentsByDay) > 0)
    <div class="section">
        <h2>Activité Quotidienne (15 derniers jours)</h2>
        <table>
            <thead>
            <tr>
                <th>Date</th>
                <th>Nombre de Rendez-vous</th>
            </tr>
            </thead>
            <tbody>
            @foreach(array_slice($appointmentsByDay, -15) as $day)
                <tr>
                    <td>{{ $day['date_formatted'] ?? 'N/A' }}</td>
                    <td><strong>{{ $day['count'] ?? 0 }}</strong></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endif

<div class="footer">
    <p>&copy; {{ date('Y') }} - Clinique Dr Dramane DIOP</p>
    <p>Rapport confidentiel - Usage personnel uniquement</p>
</div>
</body>
</html>
