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
      <div class="dashboard-header">
        <h1>Dashboard patient</h1>
        <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
      </div>
      <div class="dashboard-content" *ngIf="user">
        <div class="welcome-card">
          <img [src]="getImageUrl(user.image)" alt="Profile" class="profile-image">
          <div>
            <h2>Bienvenue, {{ user.first_name }} {{ user.last_name }}!</h2>
            <p>Rôle: {{ user.role }}</p>
            <p>Email: {{ user.email }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .dashboard-content {
      max-width: 800px;
    }

    .welcome-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .profile-image {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #1565c0;
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
    if (!imagePath) return 'assets/default-avatar.png';
    return `http://localhost:8000/storage/${imagePath}`;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
