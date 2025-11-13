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
import { HomeService } from '../../../services/home.service';

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
    eventDisplay: 'block',
    eventClassNames: (arg) => {
      return arg.event.extendedProps['disponible'] ? ['disponible-event'] : ['occupe-event'];
    }
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
    });
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

    // Vérifier si le créneau est disponible
    if (!event.extendedProps['disponible']) {
      alert('Ce créneau n\'est pas disponible');
      return;
    }

    this.selectedSlot = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      doctorId: this.doctorId,
      availabilityId: event.extendedProps['availability_id'] || event.id
    };

    // Vérifier la disponibilité en temps réel avant d'ouvrir le modal
    this.checkAndOpenModal();
  }

  checkAndOpenModal(): void {
    this.isLoading = true;

    this.homeService.checkAvailability(parseInt(this.selectedSlot.availabilityId)).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.available) {
          this.showMotifModal = true;
        } else {
          alert('Désolé, ce créneau vient d\'être réservé.');
          this.selectedSlot = null;
          this.loadDisponibilites();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur vérification:', err);
        alert('Erreur lors de la vérification du créneau.');
        this.selectedSlot = null;
      }
    });
  }

  closeMotifModal(): void {
    this.showMotifModal = false;
    this.motif = '';
    this.selectedSlot = null;
  }

  submitAppointment(): void {
    if (!this.motif.trim()) {
      alert('Veuillez saisir le motif de votre rendez-vous');
      return;
    }

    this.isSubmitting = true;

    const appointmentData = {
      doctor_id: this.doctorId,
      availability_id: parseInt(this.selectedSlot.availabilityId),
      debut_at: this.selectedSlot.start.toISOString(),
      fin_at: this.selectedSlot.end.toISOString(),
      motif: this.motif.trim()
    };

    this.homeService.createAppointment(appointmentData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Rendez-vous confirmé avec succès !');
        this.closeMotifModal();
        this.router.navigate(['/patient/mes-rendez-vous']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur création rendez-vous:', err);

        if (err.status === 401) {
          alert('Vous devez être connecté pour prendre un rendez-vous');
          this.router.navigate(['/auth/login']);
        } else if (err.error?.message) {
          alert(err.error.message);
        } else {
          alert('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
        }
      }
    });
  }

  ///////Service de mailing a implementer

  goBack(): void {
    this.router.navigate(['/patient/dashboard']);
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
