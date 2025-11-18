import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientAppointmentService } from '../../../services/patient-appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

@Component({
  selector: 'app-rsv-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rsv-patient.component.html',
  styleUrls: ['./rsv-patient.component.scss']
})
export class RsvPatientComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Modal de paiement
  showPaymentModal: boolean = false;
  selectedAppointment: Appointment | null = null;
  paymentMethod: 'ESPECES' | 'CARTE' | 'MOBILE_MONEY' | 'VIREMENT' = 'ESPECES';

  // Filtres
  filterStatus: string = 'all';
  searchTerm: string = '';

  constructor(private appointmentService: PatientAppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  /**
   * Charge tous les rendez-vous
   */
  loadAppointments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentService.getAppointments().subscribe({
      next: (response) => {
        this.appointments = response.appointments;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des rendez-vous';
        console.error('Error loading appointments:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Applique les filtres de recherche et statut
   */
  applyFilters(): void {
    this.filteredAppointments = this.appointments.filter(apt => {
      const matchesStatus = this.filterStatus === 'all' || apt.statut === this.filterStatus;
      const matchesSearch = apt.doctor_full_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  /**
   * Annule un rendez-vous
   */
  cancelAppointment(appointment: Appointment): void {
    if (!confirm(`Êtes-vous sûr d'annuler votre rendez-vous avec Dr. ${appointment.doctor_full_name} ?`)) {
      return;
    }

    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadAppointments();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Erreur lors de l\'annulation';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  /**
   * Ouvre le modal de paiement
   */
  openPaymentModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.showPaymentModal = true;
  }

  /**
   * Ferme le modal de paiement
   */
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedAppointment = null;
    this.paymentMethod = 'ESPECES';
  }

  /**
   * Confirme le paiement
   */
  confirmPayment(): void {
    if (!this.selectedAppointment) return;

    this.appointmentService.payAppointment(this.selectedAppointment.id, {
      paye_par: this.paymentMethod
    }).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.closePaymentModal();
        this.loadAppointments();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Erreur lors du paiement';
        this.closePaymentModal();
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  /**
   * Vérifie si le bouton annuler doit être affiché
   */
  canCancel(appointment: Appointment): boolean {
    return appointment.statut === 'EN ATTENTE';
  }

  /**
   * Vérifie si le bouton payer doit être affiché
   */
  canPay(appointment: Appointment): boolean {
    return appointment.statut === 'CONFIRME' && !appointment.est_paye;
  }

  /**
   * Retourne la classe CSS selon le statut
   */
  getStatusClass(statut: AppointmentStatus): string {
    const statusClasses: { [key in AppointmentStatus]: string } = {
      'EN ATTENTE': 'status-pending',
      'CONFIRME': 'status-confirmed',
      'COMPLETE': 'status-completed',
      'ANNULE': 'status-cancelled',
      'REPORT': 'status-rescheduled'
    };
    return statusClasses[statut] || '';
  }

  /**
   * Retourne le libellé du statut en français
   */
  getStatusLabel(statut: AppointmentStatus): string {
    const statusLabels: { [key in AppointmentStatus]: string } = {
      'EN ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'COMPLETE': 'Complété',
      'ANNULE': 'Annulé',
      'REPORT': 'Reporté'
    };
    return statusLabels[statut] || statut;
  }

  /**
   * Gère le changement de filtre de statut
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Gère le changement de recherche
   */
  onSearchChange(): void {
    this.applyFilters();
  }
}
