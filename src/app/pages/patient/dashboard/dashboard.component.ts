import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/auth.model';
import {Router} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="home-container">


      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h2 class="hero-title">Vivez en meilleure santé</h2>

          <div class="search-container">
            <div class="search-box">
              <div class="search-input-group">
                <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Spécialité, médecin"
                  [(ngModel)]="searchQuery"
                  class="search-input"
                />
              </div>




              <button class="btn-search" (click)="onSearch()">
                Rechercher
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="hero-image">
          <div class="image-placeholder">
            <img src="https://nii-onco.ru/wp-content/uploads/2023/12/metody-luchevoj-diagnostiki-1-1024x683.jpg" alt="Image médicale">
          </div>
        </div>
      </section>

      <!-- Info Cards -->
      <section class="info-section">
        <div class="info-cards">
          <div class="info-card">
            <div class="card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Prise de rendez-vous facile</h3>
            <p>Prenez rendez-vous en ligne 24h/24 avec vos praticiens préférés</p>
          </div>

          <div class="info-card">
            <div class="card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3>Rappels automatiques</h3>
            <p>Ne ratez plus jamais un rendez-vous grâce à nos notifications</p>
          </div>

          <div class="info-card">
            <div class="card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Suivi médical personnalisé</h3>
            <p>Accédez à votre dossier médical et historique de consultations</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
    }
    .image-placeholder {
      width: 100%;
      height: 400px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 16px;
      }
    }

    .navbar {
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      position: sticky;
      top: 0;
      z-index: 1000;

      .nav-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1565c0;
        margin: 0;
      }

      .nav-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .btn-primary {
      background: #1565c0;
      color: white;

      &:hover {
        background: #0d47a1;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(21, 101, 192, 0.4);
      }
    }

    .btn-secondary {
      background: transparent;
      color: #1565c0;

      &:hover {
        background: rgba(21, 101, 192, 0.1);
      }
    }

    .hero {
      max-width: 1200px;
      margin: 0 auto;
      padding: 4rem 2rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;

      .hero-content {
        color: white;
      }

      .hero-title {
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 2rem;
        line-height: 1.2;
      }
    }

    .search-container {
      margin-top: 2rem;
    }

    .search-box {
      background: white;
      border-radius: 12px;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

      .search-input-group {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;

        .search-icon {
          color: #666;
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 1rem;
          color: #333;

          &::placeholder {
            color: #999;
          }
        }
      }

      .search-divider {
        width: 1px;
        height: 40px;
        background: #e0e0e0;
      }

      .btn-search {
        background: #0d47a1;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;

        &:hover {
          background: #0a3d91;
          transform: translateX(4px);
        }
      }
    }

    .hero-image {
      .image-placeholder {
        width: 100%;
        height: 400px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
        border-radius: 16px;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
    }

    .info-section {
      background: white;
      padding: 4rem 2rem;

      .info-cards {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }
    }

    .info-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .card-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #1e88e5, #1565c0);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;

        svg {
          stroke: white;
          stroke-width: 2;
        }
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 0.75rem;
      }

      p {
        color: #666;
        line-height: 1.6;
      }
    }

    @media (max-width: 768px) {
      .hero {
        grid-template-columns: 1fr;

        .hero-title {
          font-size: 2rem;
        }
      }

      .info-cards {
        grid-template-columns: 1fr !important;
      }

      .nav-actions {
        gap: 0.5rem;

        button {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
      }

      .search-box {
        flex-direction: column;

        .search-divider {
          display: none;
        }

        .btn-search {
          width: 100%;
          justify-content: center;
        }
      }
    }

  `]
})
export class DashboardComponent {
  searchQuery = '';
  searchLocation = '';

  constructor(private router: Router) {}

  onSearch(): void {
    console.log('Recherche:', this.searchQuery, this.searchLocation);
    // Logique de recherche à implémenter
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
