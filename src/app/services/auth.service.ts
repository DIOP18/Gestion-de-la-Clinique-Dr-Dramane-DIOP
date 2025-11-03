import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, tap, catchError, throwError, switchMap} from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserRole } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('description', data.description);
    formData.append('gender', data.gender);
    formData.append('image', data.image);

    return this.http.get('http://localhost:8000/sanctum/csrf-cookie').pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, formData).pipe(
          tap(response => {
            if (!response.two_factor_required) {
              this.handleAuthSuccess(response);
            }
          }),
          catchError(error => {
            console.error('Erreur inscription:', error);
            return throwError(() => error);
          })
        )
      )
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.get('http://localhost:8000/sanctum/csrf-cookie').pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
          tap(response => {
            if (!response.two_factor_required) {
              this.handleAuthSuccess(response);
            }
          }),
          catchError(error => {
            console.error('Erreur connexion:', error);
            return throwError(() => error);
          })
        )
      )
    );
  }
  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        this.clearAuthData();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.redirectByRole(response.user.role);
  }

  private redirectByRole(role: UserRole): void {
    const roleRoutes: Record<UserRole, string> = {
      'ADMINISTRATEUR': '/admin/dashboard',
      'MEDECIN': '/medecin/dashboard',
      'ASSISTANT': '/assistant/dashboard',
      'PATIENT': '/patient/dashboard'
    };

    const route = roleRoutes[role] || '/';
    this.router.navigate([route]);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}
