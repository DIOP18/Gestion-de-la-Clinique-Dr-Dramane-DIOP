import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';
import {DoctorAppointmentService} from '../../../services/docteur-appointment.service';

@Component({
  selector: 'app-rsv-docteur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rsv-docteur.component.html',
  styleUrls: ['./rsv-docteur.component.scss']
})
export class RsvDocteurComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Filtres
  filterStatus: string = 'all';
  searchTerm: string = '';

  constructor(private appointmentService: DoctorAppointmentService) {}

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
      const matchesStatus =
        this.filterStatus === 'all' || apt.statut === this.filterStatus;

      const fullName = apt.patient_full_name?.toLowerCase() ?? '';
      const search = this.searchTerm?.toLowerCase() ?? '';

      const matchesSearch = fullName.includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  /**
   * Confirme un rendez-vous
   */
  confirmAppointment(appointment: Appointment): void {
    if (!confirm(`Confirmer le rendez-vous avec ${appointment.patient_full_name} ?`)) {
      return;
    }

    this.appointmentService.confirmAppointment(appointment.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadAppointments();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Erreur lors de la confirmation';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  /**
   * Annule un rendez-vous
   */
  cancelAppointment(appointment: Appointment): void {
    if (!confirm(`Êtes-vous sûr d'annuler le rendez-vous avec ${appointment.patient_full_name} ?`)) {
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
   * Reprogramme un rendez-vous (à implémenter selon votre logique)
   */
  rescheduleAppointment(appointment: Appointment): void {
    // TODO: Implémenter la logique de reprogrammation
    // Par exemple: ouvrir un modal avec les disponibilités
    alert('Fonctionnalité de reprogrammation à implémenter');
  }

  /**
   * Vérifie si le bouton reprogrammer doit être affiché
   */
  canReschedule(appointment: Appointment): boolean {
    return appointment.statut === 'CONFIRME';
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
