export type UserRole = 'ADMINISTRATEUR' | 'MEDECIN' | 'ASSISTANT' | 'PATIENT';
export type Gender = 'M' | 'F' | 'O';

export interface User {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  image: string | null;
  description: string;
  gender: Gender;
  role: UserRole;
  two_factor_secret?: string | null;
  two_factor_recovery_codes?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  two_factor_code?: string;
  two_factor_recovery_code?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  description: string;
  gender: Gender;
  image: File;
}

export interface AuthResponse {
  message?: string;
  user: User;
  token: string;
  two_factor_required?: boolean;
}
