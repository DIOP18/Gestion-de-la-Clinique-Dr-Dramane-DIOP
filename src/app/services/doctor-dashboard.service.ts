import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Rendez-vous d'aujourd'hui
export interface TodayAppointment {
  id: number;
  time: string;
  patient_name: string;
  motif: string;
  status: string;
}

export interface DoctorDashboardStats {
  success: boolean;
  filter: string;
  period: {
    start: string;
    end: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
  data: {
    overview: OverviewStats;
    time_distribution: TimeDistribution[];
    pathology_trends: PathologyTrend[];
    calendar_heatmap: CalendarData[];
    appointments_by_day: AppointmentByDay[];
    revenue_by_month: RevenueByMonth[];
  };
}

export interface OverviewStats {
  total_patients: number;
  total_appointments: number;
  appointments_today: number;
  today_appointments: TodayAppointment[];
  confirmed_appointments: number;
  canceled_appointments: number;
  rescheduled_appointments: number;
  cancellation_rate: number;
  total_revenue: number;
  avg_duration: number;
  recurring_patients: number;
}

export interface TimeDistribution {
  label: string;
  value: number;
}

export interface PathologyTrend {
  month: string;
  motif: string;
  count: number;
}

export interface CalendarData {
  date: string;
  count: number;
}

export interface AppointmentByDay {
  date: string;
  date_formatted: string;
  count: number;
}

export interface RevenueByMonth {
  month: string;
  month_formatted: string;
  revenue: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorDashboardService {
  private apiUrl = `${environment.apiUrl}/doctor/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les statistiques du dashboard
   * @param filter Période : '7', '30', '90', '365'
   */
  getStats(filter: string = '30'): Observable<DoctorDashboardStats> {
    const params = new HttpParams().set('filter', filter);
    return this.http.get<DoctorDashboardStats>(`${this.apiUrl}/stats`, { params });
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
