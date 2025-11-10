export interface Disponibilite {
  id?: number;
  date: string; // format YYYY-MM-DD
  heure_debut: string; // format HH:mm
  heure_fin: string;
  duree_consultation_minutes: number;
  created_at?: string;
  updated_at?: string;
}
