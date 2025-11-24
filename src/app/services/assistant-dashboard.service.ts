import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AssistantDashboardStats {
  success: boolean;
  date: string;
  date_formatted: string;
  data: {
    overview: OverviewStats;
    gantt: GanttAppointment[];
    funnel: FunnelData[];
    payment_stats: ChartData[];
    status_stats: ChartData[];
    confirmed_paid_appointments: ConfirmedPaidAppointment[];
    motives_stats: ChartData[];
  };
}

export interface OverviewStats {
  total_appointments_today: number;
  confirmed_today: number;
  paid_today: number;
  unpaid_today: number;
  canceled_today: number;
  completed_today: number;
  total_revenue_today: number;
  active_doctors_today: number;
}

export interface GanttAppointment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  patient_name: string;
  patient_phone: string;
  debut_at: string;
  fin_at: string;
  heure_debut: string;
  heure_fin: string;
  statut: string;
  est_paye: boolean;
  prix: number;
  motif: string;
}

export interface FunnelData {
  label: string;
  value: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface ConfirmedPaidAppointment {
  id: number;
  doctor_name: string;
  specialty: string;
  patient_name: string;
  patient_phone: string;
  heure_debut: string;
  heure_fin: string;
  prix: number;
  paye_par: string;
  motif: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantDashboardService {
  private apiUrl = `${environment.apiUrl}/assistant`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les statistiques du dashboard assistant
   */
  getStats(): Observable<AssistantDashboardStats> {
    return this.http.get<AssistantDashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  /**
   * Mettre à jour l'heure d'un rendez-vous (drag & drop)
   */
  updateAppointmentTime(id: number, debut_at: string, fin_at: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointments/${id}/update-time`, {
      debut_at,
      fin_at
    });
  }

  /**
   * Télécharger le PDF
   */
  downloadPDF(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/dashboard/export-pdf`, {
      responseType: 'blob'
    });
  }
}
