import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { HomeService } from '../../services/home.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  doctorId!: number;
  doctorName = '';
  specialty = '';
  isLoading = false;

  // Modal states
  showConfirmModal = false;
  showMotifModal = false;
  selectedSlot: any = null;
  motif = '';
  isSubmitting = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this),
    height: 'auto',
    slotMinTime: '08:00:00',
    slotMaxTime: '19:00:00',
    allDaySlot: false,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    displayEventTime: true,
    displayEventEnd: true,
    eventDisplay: 'block'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private homeService: HomeService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.doctorId = +params['doctorId'];
      this.doctorName = params['doctorName'] || '';
      this.specialty = params['specialty'] || '';

      if (this.doctorId) {
        this.loadDisponibilites();
      }

      // ✅ Gestion du retour après login/inscription
      this.handleReturnFromAuth();
    });
  }

  ngOnDestroy(): void {
    // ✅ Nettoyer le sessionStorage à la destruction du composant
    this.clearPendingSlot();
  }

  /**
   * ✅ Gère le retour après login/inscription
   */
  private handleReturnFromAuth(): void {
    const pendingSlotId = sessionStorage.getItem('pending_slot_id');
    const pendingSlotData = sessionStorage.getItem('pending_slot_data');

    console.log('🔍 Vérification retour auth:', {
      pendingSlotId,
      hasPendingData: !!pendingSlotData,
      isAuthenticated: this.homeService.isAuthenticated()
    });

    if (pendingSlotId && pendingSlotData && this.homeService.isAuthenticated()) {
      try {
        // ✅ Restaurer les données du créneau
        this.selectedSlot = JSON.parse(pendingSlotData);

        console.log('📦 Données du créneau restaurées:', this.selectedSlot);

        // ✅ Vérifier que le créneau est toujours disponible
        this.isLoading = true;

        this.homeService.checkAvailability(parseInt(pendingSlotId)).subscribe({
          next: (response) => {
            this.isLoading = false;

            if (response.available) {
              console.log('✅ Créneau disponible, ouverture modal motif');
              // ✅ Créneau toujours dispo, ouvrir modal motif
              this.showMotifModal = true;
            } else {
              console.warn('⚠️ Créneau déjà réservé');
              alert('Désolé, ce créneau a été réservé entre temps.');
              this.loadDisponibilites(); // Recharger
            }

            // ✅ Nettoyer immédiatement après vérification
            this.clearPendingSlot();
          },
          error: (err) => {
            this.isLoading = false;
            console.error('❌ Erreur vérification disponibilité:', err);
            alert('Erreur lors de la vérification du créneau.');
            this.clearPendingSlot();
          }
        });
      } catch (error) {
        console.error('❌ Erreur parsing données créneau:', error);
        this.clearPendingSlot();
      }
    } else if (pendingSlotId && !this.homeService.isAuthenticated()) {
      // ✅ Si données présentes mais pas authentifié, nettoyer
      console.log('🧹 Nettoyage données créneau (non authentifié)');
      this.clearPendingSlot();
    }
  }

  /**
   * ✅ Nettoie les données en attente dans sessionStorage
   */
  private clearPendingSlot(): void {
    sessionStorage.removeItem('pending_slot_id');
    sessionStorage.removeItem('pending_slot_data');
  }

  loadDisponibilites(month?: number, year?: number): void {
    this.isLoading = true;

    this.homeService.getDoctorDisponibilites(this.doctorId, month, year).subscribe({
      next: (events) => {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: events
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement disponibilités:', err);
        alert('Erreur lors du chargement des disponibilités');
        this.isLoading = false;
      }
    });
  }

  handleDatesSet(dateInfo: any): void {
    const date = dateInfo.start;
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (!this.isLoading) {
      this.loadDisponibilites(month, year);
    }
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const event = clickInfo.event;

    // ✅ Réinitialiser complètement le motif à chaque nouveau clic
    this.motif = '';

    this.selectedSlot = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      doctorId: this.doctorId
    };

    console.log('🎯 Créneau sélectionné:', this.selectedSlot);

    // Ouvrir le modal de confirmation
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedSlot = null;
    this.motif = ''; // ✅ Réinitialiser le motif
  }

  /**
   * ✅ VALIDATION STRICTE: Toujours vérifier l'authentification
   */
  confirmBooking(): void {
    console.log('🔐 Vérification authentification...');

    // ✅ TOUJOURS vérifier l'authentification, même si déjà fait
    if (!this.homeService.isAuthenticated()) {
      console.log('❌ Non authentifié - Redirection login');

      // Sauvegarder le créneau sélectionné
      sessionStorage.setItem('pending_slot_id', this.selectedSlot.id);
      sessionStorage.setItem('pending_slot_data', JSON.stringify(this.selectedSlot));

      this.closeConfirmModal();

      // Rediriger vers login avec returnUrl
      const currentUrl = this.router.url;
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: currentUrl,
          message: 'Veuillez vous connecter ou créer un compte pour confirmer votre rendez-vous'
        }
      });
      return;
    }

    console.log('✅ Authentifié - Vérification disponibilité');

    // ✅ Si déjà authentifié, vérifier la disponibilité puis ouvrir modal motif
    this.isLoading = true;

    this.homeService.checkAvailability(parseInt(this.selectedSlot.id)).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.available) {
          console.log('✅ Créneau disponible - Ouverture modal motif');
          this.showConfirmModal = false;
          this.showMotifModal = true;
        } else {
          console.warn('⚠️ Créneau déjà réservé');
          alert('Désolé, ce créneau vient d\'être réservé.');
          this.closeConfirmModal();
          this.loadDisponibilites();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Erreur vérification:', err);
        alert('Erreur lors de la vérification du créneau.');
      }
    });
  }

  closeMotifModal(): void {
    this.showMotifModal = false;
    this.motif = '';
    this.selectedSlot = null;

    // ✅ Nettoyer aussi le sessionStorage
    this.clearPendingSlot();
  }

  submitAppointment(): void {
    console.log('📝 Soumission RDV - Motif:', this.motif);
    console.log('📦 selectedSlot:', this.selectedSlot);

    // ✅ Validation stricte du motif
    const motifTrimmed = this.motif ? this.motif.trim() : '';

    if (!motifTrimmed || motifTrimmed.length === 0) {
      alert('⚠️ Veuillez saisir le motif de votre rendez-vous');
      return;
    }

    // ✅ Validation du créneau sélectionné
    if (!this.selectedSlot || !this.selectedSlot.id) {
      alert('⚠️ Erreur: créneau non sélectionné');
      this.closeMotifModal();
      return;
    }

    // ✅ Re-vérifier l'authentification avant soumission
    if (!this.homeService.isAuthenticated()) {
      alert('🔒 Votre session a expiré. Veuillez vous reconnecter.');
      sessionStorage.setItem('pending_slot_id', this.selectedSlot.id);
      sessionStorage.setItem('pending_slot_data', JSON.stringify(this.selectedSlot));
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.isSubmitting = true;

    const appointmentData = {
      availability_id: parseInt(this.selectedSlot.id),
      motif: motifTrimmed
    };

    console.log('📤 Envoi données:', appointmentData);

    this.homeService.createVisitorAppointment(appointmentData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        console.log('✅ RDV créé:', response);

        alert('✅ Rendez-vous créé avec succès !\n\nVous recevrez une confirmation par email.');

        this.closeMotifModal();
        this.loadDisponibilites(); // Recharger pour masquer le créneau réservé
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('❌ Erreur création RDV:', err);

        if (err.status === 409) {
          alert('❌ Désolé, ce créneau vient d\'être réservé par un autre patient.');
          this.closeMotifModal();
          this.loadDisponibilites();
        } else if (err.status === 401) {
          alert('🔒 Votre session a expiré. Veuillez vous reconnecter.');
          sessionStorage.setItem('pending_slot_id', this.selectedSlot.id);
          sessionStorage.setItem('pending_slot_data', JSON.stringify(this.selectedSlot));
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        } else if (err.status === 422) {
          const errors = err.error?.errors;
          if (errors) {
            const errorMessages = Object.values(errors).flat().join('\n');
            alert(`❌ Erreur de validation:\n${errorMessages}`);
          } else {
            alert('❌ Erreur de validation des données');
          }
        } else {
          const errorMsg = err.error?.error || 'Erreur lors de la création du rendez-vous';
          alert(`❌ ${errorMsg}`);
        }
      }
    });
  }

  goBack(): void {
    // ✅ Nettoyer avant de partir
    this.clearPendingSlot();
    this.router.navigate(['/']);
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
