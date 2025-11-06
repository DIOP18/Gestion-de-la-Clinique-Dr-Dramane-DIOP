// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserAccount, Doctor, Assistant, CreateUserRequest, PaginatedResponse } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<PaginatedResponse<UserAccount>> {
    return this.http.get<PaginatedResponse<UserAccount>>(`${this.API_URL}/users`);
  }

  createUser(data: CreateUserRequest): Observable<UserAccount> {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('gender', data.gender);
    formData.append('role', data.role);
    formData.append('image', data.image);

    return this.http.post<UserAccount>(`${this.API_URL}/users`, formData);
  }

  updateUser(id: number, data: any): Observable<UserAccount> {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null && key !== 'image') {
        formData.append(key, value);
      }
    });
    if (data.image && data.image instanceof File) {
      formData.append('image', data.image);
    }

    return this.http.post<UserAccount>(`${this.API_URL}/users/${id}?_method=PUT`, formData);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${id}`);
  }

  blockUser(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/users/${id}/block`, {});
  }

  unblockUser(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/users/${id}/unblock`, {});
  }

  getDoctors(): Observable<PaginatedResponse<Doctor>> {
    return this.http.get<PaginatedResponse<Doctor>>(`${this.API_URL}/medecins`);
  }

  createDoctor(data: CreateUserRequest): Observable<Doctor> {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('gender', data.gender);
    formData.append('image', data.image);
    formData.append('specialty_id', data.specialty_id!.toString());
    formData.append('description', data.description!);

    return this.http.post<Doctor>(`${this.API_URL}/medecins`, formData);
  }

  getAssistants(): Observable<PaginatedResponse<Assistant>> {
    return this.http.get<PaginatedResponse<Assistant>>(`${this.API_URL}/assistants`);
  }

  createAssistant(data: CreateUserRequest): Observable<Assistant> {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('gender', data.gender);
    formData.append('image', data.image);

    return this.http.post<Assistant>(`${this.API_URL}/assistants`, formData);
  }
}
