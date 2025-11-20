import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HomeService } from '../../services/home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  specialties: any[] = [];
  selectedSpecialty = '';
  doctors: any[] = [];
  isLoading = false;

  // NOUVEAU : État d'authentification
  isLoggedIn = false;
  currentUser: any = null;

  constructor(private router: Router, private homeService: HomeService) {}

  ngOnInit(): void {
    this.loadSpecialties();
    this.checkAuthStatus();
  }

  /**
   * NOUVEAU : Vérifier l'état d'authentification
   */
  checkAuthStatus(): void {
    // Vérifier si un token existe
    if (this.homeService.hasToken()) {
      // Vérifier que le token est valide
      this.homeService.verifyToken().subscribe({
        next: (response) => {
          this.isLoggedIn = true;
          this.currentUser = response.user;
        },
        error: () => {
          this.isLoggedIn = false;
          this.currentUser = null;
        }
      });
    } else {
      this.isLoggedIn = false;
      this.currentUser = null;
    }
  }

  loadSpecialties(): void {
    this.homeService.getSpecialties().subscribe({
      next: (data) => {
        this.specialties = data;
      },
      error: (err) => {
        console.error('Erreur chargement spécialités:', err);
      }
    });
  }

  onSearch(): void {
    if (!this.selectedSpecialty) {
      alert('Veuillez choisir une spécialité.');
      return;
    }

    this.isLoading = true;
    this.doctors = [];

    this.homeService.searchDoctors(this.selectedSpecialty).subscribe({
      next: (data) => {
        this.doctors = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la recherche:', err);
        alert('Erreur lors de la recherche des médecins.');
        this.isLoading = false;
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * NOUVEAU : Se déconnecter
   */
  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.homeService.logout();
      this.isLoggedIn = false;
      this.currentUser = null;
      alert('Vous avez été déconnecté avec succès.');

      // Recharger la page pour réinitialiser l'état
      window.location.reload();
    }
  }

  /**
   * NOUVEAU : Naviguer vers le dashboard selon le rôle
   */
  navigateToDashboard(): void {
    const role = this.homeService.getUserRole();

    if (role === 'PATIENT') {
      this.router.navigate(['/patient/dashboard']);
    } else if (role === 'MEDECIN') {
      this.router.navigate(['/doctor/dashboard']);
    } else if (role === 'ASSISTANT') {
      this.router.navigate(['/assistant/dashboard']);
    } else {
      // Rôle inconnu, déconnecter
      this.logout();
    }
  }

  viewDoctorCalendar(doctor: any): void {
    this.router.navigate(['/calendar'], {
      queryParams: {
        doctorId: doctor.id,
        doctorName: doctor.nom_complet,
        specialty: doctor.specialite
      }
    });
  }

  /**
   * NOUVEAU : Obtenir le nom affiché de l'utilisateur
   */
  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.name || 'Utilisateur';
    }
    return '';
  }
}
