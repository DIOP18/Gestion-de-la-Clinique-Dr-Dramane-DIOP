import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-container">
      <nav class="admin-navbar">
        <div class="nav-content">
          <div class="nav-brand">
            <h2>Clinique Dr Dramane DIOP</h2>
          </div>

          <div class="nav-menu">
            <a routerLink="/patient/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Accueil
            </a>
            <a routerLink="/medecin/disponibilites" routerLinkActive="active" class="nav-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Mes rendez-vous
            </a>
            <a routerLink="/admin/medecins" routerLinkActive="active" class="nav-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Gestion des Rendez-vous
            </a>
          </div>

          <div class="nav-actions">
            <div class="user-menu">
              <button class="user-btn" (click)="toggleDropdown()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {{ userName }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="chevron" [class.open]="isDropdownOpen">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="dropdown" [class.show]="isDropdownOpen">
                <a routerLink="/patient/profile" class="dropdown-item" (click)="closeDropdown()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Mon compte
                </a>
                <button class="dropdown-item" (click)="logout()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      min-height: 100vh;
      background: #f5f5f5;
    }

    .admin-navbar {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-brand h2 {
      color: #1565c0;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .nav-menu {
      display: flex;
      gap: 1rem;
      flex: 1;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      color: #666;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;

      svg {
        stroke-width: 2;
      }

      &:hover {
        background: #f5f5f5;
        color: #1565c0;
      }

      &.active {
        background: #e3f2fd;
        color: #1565c0;
      }
    }

    .nav-actions {
      margin-left: auto;
    }

    .user-menu {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #f5f5f5;
      color: #333;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s;

      svg {
        stroke-width: 2;
      }

      .chevron {
        transition: transform 0.3s;
        margin-left: 0.25rem;

        &.open {
          transform: rotate(180deg);
        }
      }

      &:hover {
        background: #e0e0e0;
      }
    }

    .dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 220px;
      overflow: hidden;
      animation: slideDown 0.2s ease-out;

      &.show {
        display: block;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      color: #333;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s;

      svg {
        stroke-width: 2;
        color: #666;
        flex-shrink: 0;
      }

      &:hover {
        background: #f5f5f5;
      }

      &:not(:last-child) {
        border-bottom: 1px solid #e5e7eb;
      }

      &:last-child {
        color: #c62828;

        svg {
          color: #c62828;
        }

        &:hover {
          background: #ffebee;
        }
      }
    }

    .main-content {
      width: 100%;
    }

    @media (max-width: 768px) {
      .nav-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .nav-menu {
        flex-direction: column;
        width: 100%;
      }

      .nav-actions {
        width: 100%;
        margin-left: 0;
      }

      .user-btn {
        width: 100%;
        justify-content: space-between;
      }

      .dropdown {
        width: 100%;
      }
    }
  `]
})
export class NavbarPatComponent {
  userName: string = 'John Doe'; // Remplacez par le vrai nom de l'utilisateur
  isDropdownOpen: boolean = false;

  constructor(private authService: AuthService) {
    // Récupérer le nom de l'utilisateur depuis le service d'authentification
    this.userName = this.authService.getCurrentUser()?.name || 'Utilisateur';
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.closeDropdown();
    this.authService.logout().subscribe();
  }
}
