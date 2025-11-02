import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
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
