// src/app/pages/admin/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/auth.model';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-content">
        <div class="page-header">
          <h1>Dashboard Administrateur</h1>
        </div>

        <div class="welcome-card" *ngIf="user">
          <img [src]="getImageUrl(user.image)" alt="Profile" class="profile-image">
          <div class="user-info">
            <h2>Bienvenue, {{ user.first_name }} {{ user.last_name }}!</h2>
            <p class="user-role">{{ user.role }}</p>
            <p class="user-email">{{ user.email }}</p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Médecins</h3>
              <p class="stat-number">0</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Patients</h3>
              <p class="stat-number">0</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon purple">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Rendez-vous</h3>
              <p class="stat-number">0</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Spécialités</h3>
              <p class="stat-number">0</p>
            </div>
          </div>
        </div>
      </div>

    </div>

  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f5f5f5;
    }

    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a237e;
      }
    }

    .welcome-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      gap: 2rem;
      align-items: center;
      margin-bottom: 2rem;
    }

    .profile-image {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #1565c0;
    }

    .user-info {
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 0.5rem;
      }

      .user-role {
        color: #1565c0;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .user-email {
        color: #666;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.blue {
        background: #e3f2fd;
        svg { stroke: #1565c0; }
      }

      &.green {
        background: #e8f5e9;
        svg { stroke: #2e7d32; }
      }

      &.purple {
        background: #f3e5f5;
        svg { stroke: #7b1fa2; }
      }

      &.orange {
        background: #fff3e0;
        svg { stroke: #e65100; }
      }
    }

    .stat-info {
      h3 {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.25rem;
      }

      .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: #333;
      }
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  getImageUrl(imagePath: string | null): string {
    if (!imagePath) return 'assets/imagemedical.jpg';
    return `http://localhost:8000/storage/${imagePath}`;
  }
}
