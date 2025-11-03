export interface Specialite {
  id: number;
  label: string;
  created_at?: string;
  updated_at?: string;
}

export interface SpecialiteRequest {
  label: string;
}
