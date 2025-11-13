import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getSpecialties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/specialties`);
  }

  searchDoctors(specialtyLabel: string): Observable<any[]> {
    const params = new HttpParams().set('query', specialtyLabel);
    return this.http.get<any[]>(`${this.API_URL}/doctors/search`, { params });
  }

  getDoctorDisponibilites(doctorId: number, month?: number, year?: number): Observable<any[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());

    return this.http.get<any[]>(`${this.API_URL}/doctors/${doctorId}/disponibilites`, { params });
  }
  checkAvailability(availabilityId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/availability/${availabilityId}/check`);
  }

  createVisitorAppointment(data: { availability_id: number; motif: string }): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Token non trouvé');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.API_URL}/visitor/appointments`, data, { headers });
  }
  createAppointment(data: any): Observable<any> {
    const token = localStorage.getItem('token'); // ou sessionStorage selon votre config
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return this.http.post(`${this.API_URL}/patient/rendez-vous`, data, { headers });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

}
