import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-rendez-vous',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [],
  templateUrl: './rendez-vous.component.html',
  styleUrls: ['./rendez-vous.component.scss']
})
export class RendezVousComponent {


  constructor(
    private router: Router,
  ) {
  }


  prendreRendezVous() {
    this.router.navigate(['/patient/dashboard']);
  }

}
