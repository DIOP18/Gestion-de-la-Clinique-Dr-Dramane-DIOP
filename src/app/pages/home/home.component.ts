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

  constructor(private router: Router, private homeService: HomeService) {}

  ngOnInit(): void {
    this.loadSpecialties();
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

  viewDoctorCalendar(doctor: any): void {
    this.router.navigate(['/calendar'], {
      queryParams: {
        doctorId: doctor.id,
        doctorName: doctor.nom_complet,
        specialty: doctor.specialite
      }
    });
  }
}
