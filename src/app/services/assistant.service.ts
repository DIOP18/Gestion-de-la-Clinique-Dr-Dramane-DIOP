import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';

export interface Disponibilite {
  id: number;
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  specialty_id: number;
  date: string;
  date_iso: string;
  heure_debut: string;
  heure_fin: string;
  duree_consultation: number;
}

export interface RendezVous {
  id: number;
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  specialty_id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  date: string;
  date_iso: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  statut: string;
  est_paye: boolean;
  prix: number;
  paye_par: string;
  note_medecin?: string;
  cree_par_type?: string;
}

export interface Specialty {
  id: number;
  label: string;
  prix: number;
}

// IMPORTANT : Interface correspondant aux clés du backend
export interface GlobalViewResponse {
  availability: Disponibilite[];      // Backend renvoie "availability"
  appointment: RendezVous[];           // Backend renvoie "appointment"
  stats: {
    total_disponibilites: number;
    total_rendez_vous: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private apiUrl = `${environment.apiUrl}/assistant`;

  constructor(private http: HttpClient) {}

  getGlobalView(): Observable<GlobalViewResponse> {
    return this.http.get<GlobalViewResponse>(`${this.apiUrl}/global-view`);
  }
  getSpecialties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/specialite`);
  }


}
