import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AssistantService, Disponibilite, RendezVous, Specialty } from '../../../services/assistant.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
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

  // Modal
  showDetailsModal = false;
  selectedRendezVous: RendezVous | null = null;

  constructor(private assistantService: AssistantService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      globalView: this.assistantService.getGlobalView(),
      specialties: this.assistantService.getSpecialties()
    }).subscribe({
      next: (response) => {
        console.log('Données complètes reçues:', response);

        // IMPORTANT : Utiliser les vraies clés du backend
        this.disponibilites = response.globalView.availability || [];
        this.rendezVous = response.globalView.appointment || [];
        this.stats = response.globalView.stats || {
          total_disponibilites: 0,
          total_rendez_vous: 0
        };

        this.specialties = response.specialties || [];

        console.log('📅 Disponibilités chargées:', this.disponibilites.length);
        console.log('📋 Rendez-vous chargés:', this.rendezVous.length);
        console.log('🏥 Spécialités chargées:', this.specialties.length);

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
    console.log('🔍 Application des filtres:', this.filters);

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

    console.log('✅ Disponibilités filtrées:', this.filteredDisponibilites.length);
    console.log('✅ Rendez-vous filtrés:', this.filteredRendezVous.length);
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
    console.log('📑 Onglet changé:', tab);
  }

  openDetailsModal(rdv: RendezVous): void {
    this.selectedRendezVous = rdv;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRendezVous = null;
  }
}
