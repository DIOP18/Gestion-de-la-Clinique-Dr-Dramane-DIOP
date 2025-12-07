import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { AssistantService, Disponibilite, RendezVous, Specialty, CalendarAvailability } from '../../../services/assistant.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule
  ],
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.scss']
})
export class AssistantComponent implements OnInit {
  loading = false;
  activeTab: 'disponibilites' | 'rendez-vous' = 'disponibilites';

  // Données
  disponibilites: Disponibilite[] = [];
  rendezVous: RendezVous[] = [];

  // Données filtrées
  filteredDisponibilites: Disponibilite[] = [];
  filteredRendezVous: RendezVous[] = [];

  // Stats
  stats = {
    total_disponibilites: 0,
    total_rendez_vous: 0
  };

  // Filtres
  filters = {
    searchDoctor: '',
    selectedSpecialty: '',
    selectedDate: ''
  };

  // Spécialités
  specialties: Specialty[] = [];

  // Modal détails
  showDetailsModal = false;
  selectedRendezVous: RendezVous | null = null;

  showRescheduleModal = false;
  appointmentToReschedule: RendezVous | null = null;
  rescheduleReason = '';
  isLoadingCalendar = false;
  isSubmittingReschedule = false;
  selectedNewSlot: any = null;

  doctors: any[] = [];
  rescheduleFilters = {
    selectedDoctor: '',
    selectedSpecialty: ''
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine'
    },
    events: [],
    eventClick: this.handleCalendarEventClick.bind(this),
    height: 'auto',
    slotMinTime: '08:00:00',
    slotMaxTime: '19:00:00',
    allDaySlot: false,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    displayEventTime: true,
    displayEventEnd: true,
    eventDisplay: 'block',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00', // Affiche les heures toutes les heures pour plus de clarté
    expandRows: true,
    nowIndicator: true,
    scrollTime: '08:00:00',
    contentHeight: 'auto',
    aspectRatio: 1.8
  };
  constructor(private assistantService: AssistantService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      globalView: this.assistantService.getGlobalView(),
      specialties: this.assistantService.getSpecialties(),
      doctors: this.assistantService.getDoctors()
    }).subscribe({
      next: (response) => {
        console.log('Données complètes reçues:', response);

        this.disponibilites = response.globalView.availability || [];
        this.rendezVous = response.globalView.appointment || [];
        this.stats = response.globalView.stats || {
          total_disponibilites: 0,
          total_rendez_vous: 0
        };

        this.specialties = response.specialties || [];
        this.doctors = response.doctors || [];



        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error(' Erreur chargement:', error);
        console.error('Détails:', error.error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    console.log('Application des filtres:', this.filters);

    // Filtrer disponibilités
    this.filteredDisponibilites = this.disponibilites.filter(dispo => {
      const matchSearch = !this.filters.searchDoctor ||
        dispo.doctor_name.toLowerCase().includes(this.filters.searchDoctor.toLowerCase());

      const matchSpecialty = !this.filters.selectedSpecialty ||
        dispo.specialty === this.filters.selectedSpecialty;

      const matchDate = !this.filters.selectedDate ||
        dispo.date_iso === this.filters.selectedDate;

      return matchSearch && matchSpecialty && matchDate;
    });

    // Filtrer rendez-vous
    this.filteredRendezVous = this.rendezVous.filter(rdv => {
      const matchSearch = !this.filters.searchDoctor ||
        rdv.doctor_name.toLowerCase().includes(this.filters.searchDoctor.toLowerCase()) ||
        rdv.patient_name.toLowerCase().includes(this.filters.searchDoctor.toLowerCase());

      const matchSpecialty = !this.filters.selectedSpecialty ||
        rdv.specialty === this.filters.selectedSpecialty;

      const matchDate = !this.filters.selectedDate ||
        rdv.date_iso === this.filters.selectedDate;

      return matchSearch && matchSpecialty && matchDate;
    });

    console.log('Disponibilités filtrées:', this.filteredDisponibilites.length);
    console.log('Rendez-vous filtrés:', this.filteredRendezVous.length);
  }

  resetFilters(): void {
    this.filters = {
      searchDoctor: '',
      selectedSpecialty: '',
      selectedDate: ''
    };
    this.applyFilters();
  }

  switchTab(tab: 'disponibilites' | 'rendez-vous'): void {
    this.activeTab = tab;
    console.log('Onglet changé:', tab);
  }

  openDetailsModal(rdv: RendezVous): void {
    this.selectedRendezVous = rdv;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRendezVous = null;
  }

  canReschedule(appointment: RendezVous): boolean {
    return appointment.statut === 'CONFIRME';
  }

  openRescheduleModal(appointment: RendezVous): void {
    this.appointmentToReschedule = appointment;
    this.showRescheduleModal = true;
    this.rescheduleReason = '';
    this.selectedNewSlot = null;
    this.rescheduleFilters = {
      selectedDoctor: '',
      selectedSpecialty: ''
    };

    this.loadAvailabilitiesForCalendar();
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.appointmentToReschedule = null;
    this.rescheduleReason = '';
    this.selectedNewSlot = null;
    this.rescheduleFilters = {
      selectedDoctor: '',
      selectedSpecialty: ''
    };
  }

  loadAvailabilitiesForCalendar(): void {
    this.isLoadingCalendar = true;

    const doctorId = this.rescheduleFilters.selectedDoctor ? parseInt(this.rescheduleFilters.selectedDoctor) : undefined;
    const specialtyId = this.rescheduleFilters.selectedSpecialty ? parseInt(this.rescheduleFilters.selectedSpecialty) : undefined;

    this.assistantService.getAvailabilitiesForReschedule(doctorId, specialtyId).subscribe({
      next: (availabilities: CalendarAvailability[]) => {
        console.log('Disponibilités chargées pour calendrier:', availabilities.length);

        const calendarEvents = availabilities.map(avail => ({
          id: avail.id.toString(),
          title: avail.doctor_name,
          start: avail.start,
          end: avail.end,
          backgroundColor: avail.backgroundColor,
          borderColor: avail.borderColor,
          extendedProps: {
            doctor_id: avail.doctor_id,
            specialty: avail.specialty,
            specialty_id: avail.specialty_id,
            heure_debut: avail.heure_debut,
            heure_fin: avail.heure_fin
          }
        }));

        // Mettre à jour les événements du calendrier
        this.calendarOptions = {
          ...this.calendarOptions,
          events: calendarEvents
        };

        this.isLoadingCalendar = false;
      },
      error: (error) => {
        console.error(' Erreur chargement disponibilités calendrier:', error);
        alert('Erreur lors du chargement des disponibilités');
        this.isLoadingCalendar = false;
      }
    });
  }
  applyRescheduleFilters(): void {
    console.log(' Filtres reprogrammation:', this.rescheduleFilters);
    this.loadAvailabilitiesForCalendar();
  }

  resetRescheduleFilters(): void {
    this.rescheduleFilters = {
      selectedDoctor: '',
      selectedSpecialty: ''
    };
    this.loadAvailabilitiesForCalendar();
  }

  handleCalendarEventClick(clickInfo: EventClickArg): void {
    const event = clickInfo.event;

    this.selectedNewSlot = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps
    };

    console.log(' Créneau sélectionné:', this.selectedNewSlot);
  }

  confirmReschedule(): void {
    if (!this.selectedNewSlot) {
      alert('Veuillez sélectionner un nouveau créneau sur le calendrier');
      return;
    }

    if (!this.appointmentToReschedule) {
      alert('Erreur : rendez-vous introuvable');
      return;
    }

    const confirmMessage = `Confirmer la reprogrammation ?\n\n` +
      `Ancien RDV : ${this.appointmentToReschedule.date} à ${this.appointmentToReschedule.heure_debut}\n` +
      `Nouveau RDV : ${this.formatDate(this.selectedNewSlot.start)} à ${this.formatTime(this.selectedNewSlot.start)}\n\n` +
      `Le patient et le médecin seront notifiés par email.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.isSubmittingReschedule = true;

    this.assistantService.rescheduleAppointment(
      this.appointmentToReschedule.id,
      parseInt(this.selectedNewSlot.id),
      this.rescheduleReason.trim() || undefined
    ).subscribe({
      next: (response) => {
        console.log('RDV reprogrammé:', response);
        alert('Rendez-vous reprogrammé avec succès ! Le patient et le médecin ont été notifiés par email.');

        this.closeRescheduleModal();
        this.loadData(); // Recharger les données
        this.isSubmittingReschedule = false;
      },
      error: (error) => {
        console.error('Erreur reprogrammation:', error);

        let errorMessage = 'Erreur lors de la reprogrammation';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        alert(`${errorMessage}`);
        this.isSubmittingReschedule = false;
      }
    });
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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
