import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1>Accès non autorisé</h1>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <button class="btn btn-primary" (click)="goHome()">Retour à l'accueil</button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%);
      padding: 2rem;
    }

    .unauthorized-content {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      max-width: 500px;
    }

    .icon {
      margin-bottom: 2rem;
    }

    h1 {
      color: #c62828;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
