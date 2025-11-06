// src/app/models/user.models.ts

export interface UserAccount {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  image: string | null;
  gender: 'M' | 'F' | 'O';
  role: 'ADMINISTRATEUR' | 'MEDECIN' | 'ASSISTANT' | 'PATIENT';
  is_blocked: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  num_ordre: string;
  specialty_id: number;
  description: string;
  user?: UserAccount;
  specialty?: { id: number; label: string };
  created_at?: string;
}

export interface Assistant {
  id: number;
  user_id: number;
  num_employe: string;
  user?: UserAccount;
  created_at?: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  gender: 'M' | 'F' | 'O';
  role: 'ADMINISTRATEUR' | 'MEDECIN' | 'ASSISTANT';
  image: File;
  specialty_id?: number;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
