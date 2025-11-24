import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  success: boolean;
  filter: string;
  period: {
    start: string;
    end: string;
  };
  data: {
    overview: OverviewStats;
    appointments_by_day: AppointmentByDay[];
    heatmap: HeatmapData[];
    specialty_stats: SpecialtyStats[];
    network: NetworkData;
    patient_journey: PatientJourney;
  };
}

export interface OverviewStats {
  total_patients: number;
  new_patients: number;
  loyal_patients: number;
  total_doctors: number;
  total_assistants: number;
  total_staff: number;
  appointments_today: number;
  appointments_confirmed: number;
  total_appointments: number;
  canceled_appointments: number;
  cancellation_rate: number;
  total_revenue: number;
}

export interface AppointmentByDay {
  date: string;
  date_formatted: string;
  count: number;
}

export interface HeatmapData {
  day: string;
  day_num: number;
  hour: string;
  hour_num: number;
  count: number;
}

export interface SpecialtyStats {
  id: number;
  label: string;
  prix: number;
  doctor_count: number;
  total_appointments: number;
  revenue: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'doctor' | 'patient';
  specialty?: string;
  appointment_count: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface PatientJourney {
  new_patients: number;
  first_consultation: number;
  follow_up: number;
  loyal_patients: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les statistiques du dashboard
   * @param filter Période : '7', '30', '90', '365'
   */
  getStats(filter: string = '30'): Observable<DashboardStats> {
    const params = new HttpParams().set('filter', filter);
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Télécharger le PDF
   */
  downloadPDF(filter: string = '30'): Observable<Blob> {
    const params = new HttpParams().set('filter', filter);
    return this.http.get(`${this.apiUrl}/export-pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
