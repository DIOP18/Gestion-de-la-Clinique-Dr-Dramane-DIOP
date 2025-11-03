// src/app/services/specialite.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Specialite, SpecialiteRequest } from '../models/specialite.model';

@Injectable({
  providedIn: 'root'
})
export class SpecialiteService {
  private readonly API_URL = `${environment.apiUrl}/specialites`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Specialite[]> {
    return this.http.get<Specialite[]>(this.API_URL);
  }

  create(data: SpecialiteRequest): Observable<Specialite> {
    return this.http.post<Specialite>(this.API_URL, data);
  }

  update(id: number, data: SpecialiteRequest): Observable<Specialite> {
    return this.http.put<Specialite>(`${this.API_URL}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
