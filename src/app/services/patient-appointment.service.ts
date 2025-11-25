import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  AppointmentResponse,
  AppointmentActionResponse,
  PaymentRequest, PaymentIntentResponse, ConfirmPaymentRequest
} from '../models/appointment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientAppointmentService {
  private apiUrl = `${environment.apiUrl}/patient`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les headers avec token d'authentification
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupère tous les rendez-vous du patient connecté
   */
  getAppointments(): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(
      `${this.apiUrl}/appointments`,
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


  /**
   * Paye un rendez-vous (méthode traditionnelle - non Stripe)
   */
  payAppointment(appointmentId: number, paymentData: PaymentRequest): Observable<AppointmentActionResponse> {
    return this.http.post<AppointmentActionResponse>(
      `${this.apiUrl}/appointments/${appointmentId}/pay`,
      paymentData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Créer un Payment Intent Stripe
   */
  createPaymentIntent(appointmentId: number): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(
      `${this.apiUrl}/appointments/${appointmentId}/create-payment-intent`,
      {},
      { headers: this.getHeaders() }
    );
  }

  downloadInvoice(appointmentId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/appointments/${appointmentId}/invoice/download`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }
  /**
   * Confirmer le paiement Stripe
   */
  confirmPayment(appointmentId: number, data: ConfirmPaymentRequest): Observable<AppointmentActionResponse> {
    return this.http.post<AppointmentActionResponse>(
      `${this.apiUrl}/appointments/${appointmentId}/confirm-payment`,
      data,
      { headers: this.getHeaders() }
    );
  }

}
