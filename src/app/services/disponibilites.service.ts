import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Disponibilite } from '../models/disponibilites.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DisponibilitesService {
  private readonly API_URL = `${environment.apiUrl}/medecin/disponibilites`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Disponibilite[]> {
    return this.http.get<Disponibilite[]>(this.API_URL);
  }

  create(data: Disponibilite): Observable<Disponibilite> {
    return this.http.post<Disponibilite>(this.API_URL, data);
  }

  update(id: number, data: Partial<Disponibilite>): Observable<Disponibilite> {
    return this.http.put<Disponibilite>(`${this.API_URL}/${id}`, data);
  }


  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
