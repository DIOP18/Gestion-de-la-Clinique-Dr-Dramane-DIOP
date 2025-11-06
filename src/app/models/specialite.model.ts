export interface Specialite {
  id: number;
  label: string;
  prix: number;
  created_at?: string;
  updated_at?: string;
}

export interface SpecialiteRequest {
  label: string;
  prix: number;
}
