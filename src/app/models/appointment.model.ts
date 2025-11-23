export interface Appointment {
  id: number;
  patient_nom?: string;
  patient_prenom?: string;
  patient_full_name?: string;
  doctor_nom?: string;
  doctor_prenom?: string;
  doctor_full_name?: string;
  specialty?: string;
  debut_at: string;
  fin_at: string;
  heure_debut: string;
  heure_fin: string;
  date: string;
  statut: AppointmentStatus;
  motif: string;
  est_paye: boolean;
  prix: number;
  paye_par: string | null;
  note_medecin: string | null;
  cree_par_type?: string;
}

export type AppointmentStatus =
  | 'EN ATTENTE'
  | 'CONFIRME'
  | 'COMPLETE'
  | 'ANNULE'
  | 'REPORT';

export interface AppointmentResponse {
  appointments: Appointment[];
}

export interface AppointmentActionResponse {
  message: string;
  appointment: Appointment;
}


export interface PaymentRequest {
  paye_par: 'ESPECES' | 'CARTE' | 'MOBILE_MONEY' | 'VIREMENT';
}
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export interface ConfirmPaymentRequest {
  payment_intent_id: string;
}
