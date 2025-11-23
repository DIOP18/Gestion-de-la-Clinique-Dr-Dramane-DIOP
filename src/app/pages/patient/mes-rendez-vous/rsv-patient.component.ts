import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientAppointmentService } from '../../../services/patient-appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

// Déclaration Stripe
declare var Stripe: any;

@Component({
  selector: 'app-rsv-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rsv-patient.component.html',
  styleUrls: ['./rsv-patient.component.scss']
})
export class RsvPatientComponent implements OnInit {
  @ViewChild('cardElement') cardElement!: ElementRef;

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Modal de paiement
  showPaymentModal: boolean = false;
  selectedAppointment: Appointment | null = null;
  paymentMethod: 'STRIPE' | 'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT' = 'STRIPE';
  paymentStep: 'init' | 'card' | 'processing' | 'success' = 'init';
  paymentError: string = '';

  // Stripe
  stripe: any = null;
  cardElementStripe: any = null;
  clientSecret: string = '';
  paymentIntentId: string = '';

  // Filtres
  filterStatus: string = 'all';
  searchTerm: string = '';

  constructor(private appointmentService: PatientAppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.initializeStripe();
  }

  /**
   * Initialiser Stripe
   */
  initializeStripe(): void {
    // Remplacez par votre clé publique Stripe
    this.stripe = Stripe('pk_test_51SW2w63bKlYWTdntu4FGX31qG3PKThotlZMsXatDsxnTf2FuXpwf4QcmF8tlrd9J2H8tv2wLIJNW5ruYMP2Zvb3F00CJ6mKut9');
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
    this.paymentStep = 'init';
    this.paymentError = '';
    this.clientSecret = '';
    this.paymentIntentId = '';
  }

  /**
   * Ferme le modal de paiement
   */
  closePaymentModal(): void {
    // Détruire l'élément Stripe AVANT de fermer le modal
    if (this.cardElementStripe) {
      try {
        this.cardElementStripe.unmount();
        this.cardElementStripe.destroy();
      } catch (e) {
        console.log('Error destroying Stripe element:', e);
      }
      this.cardElementStripe = null;
    }

    this.showPaymentModal = false;
    this.selectedAppointment = null;
    this.paymentMethod = 'STRIPE';
    this.paymentStep = 'init';
    this.paymentError = '';
    this.clientSecret = '';
    this.paymentIntentId = '';
  }

  /**
   * Passer à l'étape de paiement par carte
   */
  proceedToCardPayment(): void {
    if (!this.selectedAppointment) return;

    if (this.paymentMethod === 'STRIPE') {
      this.paymentError = '';

      // Créer le Payment Intent
      this.appointmentService.createPaymentIntent(this.selectedAppointment.id).subscribe({
        next: (response) => {
          this.clientSecret = response.clientSecret;
          this.paymentIntentId = response.paymentIntentId;

          // Changer l'étape APRÈS avoir reçu le clientSecret
          this.paymentStep = 'card';

          // Attendre que le DOM soit complètement rendu
          setTimeout(() => {
            this.mountStripeCard();
          }, 300);
        },
        error: (error) => {
          this.paymentError = error.error?.error || 'Erreur lors de l\'initialisation du paiement';
          this.paymentStep = 'init';
        }
      });
    } else {
      // Paiement non-Stripe
      this.processNonStripePayment();
    }
  }

  /**
   * Monter l'élément de carte Stripe
   */
  mountStripeCard(): void {
    const cardElementContainer = document.getElementById('card-element');

    if (!cardElementContainer) {
      console.error('card-element not found in DOM');
      this.paymentError = 'Erreur d\'initialisation du formulaire de paiement';
      return;
    }

    // Détruire l'élément existant s'il y en a un
    if (this.cardElementStripe) {
      this.cardElementStripe.unmount();
      this.cardElementStripe.destroy();
    }

    try {
      const elements = this.stripe.elements();

      const style = {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      };

      this.cardElementStripe = elements.create('card', { style });
      this.cardElementStripe.mount('#card-element');

      // Écouter les erreurs de validation
      this.cardElementStripe.on('change', (event: any) => {
        if (event.error) {
          this.paymentError = event.error.message;
        } else {
          this.paymentError = '';
        }
      });

      console.log('Stripe Card Element mounted successfully');
    } catch (error: any) {
      console.error('Error mounting Stripe card:', error);
      this.paymentError = 'Erreur lors de l\'initialisation de Stripe';
    }
  }

  /**
   * Confirmer le paiement Stripe
   */
  async confirmStripePayment(): Promise<void> {
    if (!this.selectedAppointment) {
      this.paymentError = 'Rendez-vous non sélectionné';
      return;
    }

    if (!this.cardElementStripe) {
      this.paymentError = 'Formulaire de carte non initialisé';
      return;
    }

    if (!this.clientSecret) {
      this.paymentError = 'Clé de paiement manquante';
      return;
    }


    this.paymentError = '';

    try {
      console.log('Starting payment confirmation...');
      console.log('Client Secret:', this.clientSecret);

      // Étape 1: Créer la méthode de paiement PENDANT QUE l'élément est encore visible
      const { error: createError, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElementStripe,
      });

      if (createError) {
        console.error('Error creating payment method:', createError);
        this.paymentError = createError.message || 'Erreur lors de la validation de la carte';
        return;
      }

      console.log('Payment method created:', paymentMethod);

      // ✅ MAINTENANT on peut changer l'état car on a déjà récupéré les données
      this.paymentStep = 'processing';

      // Étape 2: Confirmer le paiement avec la méthode de paiement créée
      const { error: confirmError, paymentIntent } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );

      if (confirmError) {
        console.error('Stripe payment error:', confirmError);
        this.paymentError = confirmError.message || 'Erreur lors du paiement';
        this.paymentStep = 'card';
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment successful:', paymentIntent);

        // Confirmer le paiement côté serveur
        this.appointmentService.confirmPayment(
          this.selectedAppointment.id,
          { payment_intent_id: paymentIntent.id }
        ).subscribe({
          next: (response) => {
            this.paymentStep = 'success';
            this.successMessage = response.message;

            // Rafraîchir les rendez-vous après un délai
            setTimeout(() => {
              this.loadAppointments();
              this.closePaymentModal();
            }, 2000);
          },
          error: (error) => {
            console.error('Server confirmation error:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.error);
            this.paymentError = error.error?.error || error.error?.message || 'Erreur lors de la confirmation du paiement';
            this.paymentStep = 'card';
          }
        });
      } else {
        this.paymentError = 'Le paiement n\'a pas pu être complété';
        this.paymentStep = 'card';
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      this.paymentError = err.message || 'Erreur inattendue lors du paiement';
      this.paymentStep = 'card';
    }
  }

  /**
   * Traiter un paiement non-Stripe
   */
  processNonStripePayment(): void {
    if (!this.selectedAppointment) return;

    this.paymentStep = 'processing';
    this.paymentError = '';

    this.appointmentService.payAppointment(
      this.selectedAppointment.id,
      { paye_par: this.paymentMethod as any }
    ).subscribe({
      next: (response) => {
        this.paymentStep = 'success';
        this.successMessage = response.message;

        setTimeout(() => {
          this.loadAppointments();
          this.closePaymentModal();
        }, 2000);
      },
      error: (error) => {
        this.paymentError = error.error?.error || 'Erreur lors du paiement';
        this.paymentStep = 'init';
      }
    });
  }

  canCancel(appointment: Appointment): boolean {
    return appointment.statut === 'EN ATTENTE';
  }

  canPay(appointment: Appointment): boolean {
    return appointment.statut === 'CONFIRME' && !appointment.est_paye;
  }

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

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }
}
