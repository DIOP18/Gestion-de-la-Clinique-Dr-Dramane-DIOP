import { Component, OnInit } from '@angular/core';
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
export class CalendarComponent implements OnInit {
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

  // État d'authentification
  isCheckingAuth = false;

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

      // Gestion du retour après login/inscription
      this.handleReturnFromAuth();
    });
  }

  /**
   * CORRIGÉ : Gère le retour après login/inscription avec vérification du token
   */
  private handleReturnFromAuth(): void {
    const pendingSlotId = sessionStorage.getItem('pending_slot_id');

    if (pendingSlotId) {
      // Vérifier que l'utilisateur EST VRAIMENT authentifié avec un token valide
      this.isCheckingAuth = true;

      this.homeService.verifyToken().subscribe({
        next: (authResponse) => {
          console.log('Utilisateur authentifié:', authResponse.user);

          const slotData = sessionStorage.getItem('pending_slot_data');

          if (slotData) {
            this.selectedSlot = JSON.parse(slotData);

            // Vérifier que le créneau est toujours disponible
            this.homeService.checkAvailability(parseInt(pendingSlotId)).subscribe({
              next: (response) => {
                this.isCheckingAuth = false;

                if (response.available) {
                  // Créneau toujours disponible, ouvrir directement le modal motif
                  // (On saute le modal de confirmation car l'utilisateur l'a déjà vu)
                  this.showMotifModal = true;
                } else {
                  alert('Désolé, ce créneau a été réservé entre temps.');
                  this.loadDisponibilites();
                }
              },
              error: (err) => {
                this.isCheckingAuth = false;
                console.error('Erreur vérification disponibilité:', err);
                alert('Erreur lors de la vérification du créneau.');
              },
              complete: () => {
                // Nettoyer le storage
                sessionStorage.removeItem('pending_slot_id');
                sessionStorage.removeItem('pending_slot_data');
              }
            });
          }
        },
        error: (err) => {
          this.isCheckingAuth = false;
          console.error('Token invalide ou expiré:', err);

          // Token invalide, redemander connexion
          alert('Votre session a expiré. Veuillez vous reconnecter.');

          // Garder les données pour après la nouvelle connexion
          this.router.navigate(['/auth/login'], {
            queryParams: {
              returnUrl: this.router.url,
              message: 'Votre session a expiré. Veuillez vous reconnecter.'
            }
          });
        }
      });
    }
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

    this.selectedSlot = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      doctorId: this.doctorId
    };

    // Ouvrir le modal de confirmation
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedSlot = null;
  }

  /**
   * CORRIGÉ : Confirmation de réservation avec vérification systématique de l'authentification
   */
  confirmBooking(): void {
    // TOUJOURS vérifier l'authentification en temps réel avant de procéder
    this.isCheckingAuth = true;

    this.homeService.verifyToken().subscribe({
      next: (authResponse) => {
        console.log('Utilisateur vérifié:', authResponse.user);
        this.isCheckingAuth = false;

        // Token valide, continuer la réservation
        this.proceedWithBooking();
      },
      error: (err) => {
        this.isCheckingAuth = false;
        console.error('Authentification échouée:', err);

        // Token invalide, expiré ou absent : rediriger vers login
        this.redirectToLogin();
      }
    });
  }

  /**
   * NOUVEAU : Procéder à la vérification du créneau puis ouvrir modal motif
   */
  private proceedWithBooking(): void {
    this.isLoading = true;

    this.homeService.checkAvailability(parseInt(this.selectedSlot.id)).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.available) {
          // Fermer modal confirmation, ouvrir modal motif
          this.showConfirmModal = false;
          this.showMotifModal = true;
        } else {
          alert('Désolé, ce créneau vient d\'être réservé.');
          this.closeConfirmModal();
          this.loadDisponibilites();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur vérification:', err);
        alert('Erreur lors de la vérification du créneau.');
      }
    });
  }

  /**
   * NOUVEAU : Rediriger vers login en sauvegardant le contexte
   */
  private redirectToLogin(): void {
    // Sauvegarder le créneau sélectionné
    sessionStorage.setItem('pending_slot_id', this.selectedSlot.id);
    sessionStorage.setItem('pending_slot_data', JSON.stringify(this.selectedSlot));

    this.closeConfirmModal();

    // Rediriger vers login avec returnUrl
    const currentUrl = this.router.url;
    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: currentUrl,
        message: 'Veuillez vous connecter ou créer un compte pour confirmer votre rendez-vous'
      }
    });
  }

  closeMotifModal(): void {
    this.showMotifModal = false;
    this.motif = '';
    // Ne pas réinitialiser selectedSlot ici pour garder les infos si besoin
  }

  /**
   * CORRIGÉ : Soumission du rendez-vous avec gestion d'erreurs améliorée
   */
  submitAppointment(): void {
    if (!this.motif.trim()) {
      alert('Veuillez saisir le motif de votre rendez-vous');
      return;
    }

    this.isSubmitting = true;

    const appointmentData = {
      availability_id: parseInt(this.selectedSlot.id),
      motif: this.motif.trim()
    };

    this.homeService.createVisitorAppointment(appointmentData).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        console.log('Rendez-vous créé:', response);

        // Message de succès personnalisé
        alert(`Rendez-vous confirmé avec succès !`);

        // Nettoyer
        this.closeMotifModal();
        this.selectedSlot = null;

        // Rediriger vers le dashboard patient
        this.router.navigate(['/patient/mes-rendez-vous']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur création RDV:', err);

        if (err.status === 409) {
          // Créneau déjà pris
          alert(' Désolé, ce créneau vient d\'être réservé par un autre patient.');
          this.closeMotifModal();
          this.loadDisponibilites();
        } else if (err.status === 401) {
          // Session expirée
          alert(' Votre session a expiré. Veuillez vous reconnecter.');
          sessionStorage.setItem('pending_slot_id', this.selectedSlot.id);
          sessionStorage.setItem('pending_slot_data', JSON.stringify(this.selectedSlot));
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        } else if (err.status === 422) {
          // Erreurs de validation
          const errors = err.error?.errors;
          if (errors) {
            const errorMessages = Object.values(errors).flat().join('\n');
            alert(` Erreur de validation :\n${errorMessages}`);
          } else {
            alert('Données invalides. Veuillez vérifier votre saisie.');
          }
        } else {
          // Autres erreurs
          const errorMsg = err.error?.message || err.error?.error || 'Erreur lors de la création du rendez-vous';
          alert(` ${errorMsg}`);
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
