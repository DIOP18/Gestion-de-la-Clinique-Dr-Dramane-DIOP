import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  AppointmentResponse,
  AppointmentActionResponse
} from '../models/appointment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorAppointmentService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les headers avec token d'authentification
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Changé de 'auth_token' à 'token'
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupère tous les rendez-vous du docteur connecté
   */
  getAppointments(): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(
      `${this.apiUrl}/appointments`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Confirme un rendez-vous
   */
  confirmAppointment(appointmentId: number): Observable<AppointmentActionResponse> {
    return this.http.put<AppointmentActionResponse>(
      `${this.apiUrl}/appointments/${appointmentId}/confirm`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Annule un rendez-vous
   */
  cancelAppointment(appointmentId: number): Observable<AppointmentActionResponse> {
    return this.http.put<AppointmentActionResponse>(
      `${this.apiUrl}/appointments/${appointmentId}/cancel`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
