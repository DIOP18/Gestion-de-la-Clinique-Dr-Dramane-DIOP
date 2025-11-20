import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError, map, Observable, of, throwError} from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les spécialités
   */
  getSpecialties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/specialties`);
  }

  /**
   * Rechercher des médecins par spécialité
   */
  searchDoctors(specialtyLabel: string): Observable<any[]> {
    const params = new HttpParams().set('query', specialtyLabel);
    return this.http.get<any[]>(`${this.API_URL}/doctors/search`, { params });
  }

  /**
   * Récupérer les disponibilités d'un médecin
   */
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
      return throwError(() => new Error('Token non trouvé. Veuillez vous connecter.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.API_URL}/visitor/appointments`, data, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearAuth();
        }
        return throwError(() => error);
      })
    );
  }


  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  createAppointment(data: any): Observable<any> {
    const token = localStorage.getItem('token'); // ou sessionStorage selon votre config
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return this.http.post(`${this.API_URL}/patient/rendez-vous`, data, { headers });
  }

  verifyToken(): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      return throwError(() => new Error('Aucun token trouvé'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.API_URL}/auth/verify`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si le token est invalide, le supprimer
        if (error.status === 401) {
          this.clearAuth();
        }
        return throwError(() => error);
      })
    );
  }
  isAuthenticatedAsync(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      return of(false);
    }

    return this.verifyToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearAuth();
        return of(false);
      })
    );
  }
  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
  logout(): void {
    this.clearAuth();
  }
  private clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    // Nettoyer aussi le sessionStorage si nécessaire
    sessionStorage.removeItem('pending_slot_id');
    sessionStorage.removeItem('pending_slot_data');
  }
  getCurrentUser(): any {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Obtenir le rôle de l'utilisateur connecté
   */
  getUserRole(): string | null {
    return localStorage.getItem('role');
  }




}
