import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DisponibilitesService } from '../../../services/disponibilites.service';
import { Disponibilite } from '../../../models/disponibilites.model';

// Fonctions de validation personnalisées
function dateValidator(control: AbstractControl): ValidationErrors | null {
  const today = new Date().toISOString().split('T')[0];
  if (control.value && control.value < today) {
    return { dateInvalid: true };
  }
  return null;
}
function consultationHoursValidator(control: AbstractControl): ValidationErrors | null {
  const form = control as FormGroup;
  const heureDebut = form.get('heure_debut')?.value;
  const heureFin = form.get('heure_fin')?.value;

  if (heureDebut && heureFin) {
    const minTime = 7 * 60;     // 7h00 en minutes
    const maxTime = 18 * 60;    // 18h00 en minutes
    const start = toMinutes(heureDebut);
    const end = toMinutes(heureFin);

    if (start < minTime) {
      return { heureDebutTropTot: true };
    }
    if (end > maxTime) {
      return { heureFinTropTard: true };
    }
  }
  return null;
}


function heureDebutValidator(control: AbstractControl): ValidationErrors | null {
  const form = control as FormGroup;
  const date = form.get('date')?.value;
  const heureDebut = form.get('heure_debut')?.value;
  const today = new Date().toISOString().split('T')[0];
  if (date === today && heureDebut) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(heureDebut);
    if (start <= currentTime) {
      return { heureDebutInvalid: true };
    }
  }
  return null;
}

function heureFinValidator(control: AbstractControl): ValidationErrors | null {
  const form = control as FormGroup;
  const heureDebut = form.get('heure_debut')?.value;
  const heureFin = form.get('heure_fin')?.value;
  if (heureDebut && heureFin) {
    const start = toMinutes(heureDebut);
    const end = toMinutes(heureFin);
    if (end <= start) {
      return { heureFinInvalid: true };
    }
  }
  return null;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

@Component({
  selector: 'app-disponibilites',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Gestion des disponibilités</h1>
        <button class="btn-primary" (click)="openModal()"> Nouvelle disponibilité</button>
      </div>

      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div *ngIf="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

      <div class="table-container" *ngIf="disponibilites.length > 0; else noData">
        <table class="data-table">
          <thead>
          <tr>
            <th>Date</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Durée (min)</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let d of disponibilites">
            <td>{{ d.date }}</td>
            <td>{{ d.heure_debut }}</td>
            <td>{{ d.heure_fin }}</td>
            <td>{{ d.duree_consultation_minutes }}</td>
            <td class="actions">
              <button class="btn-edit" (click)="openModal(d)">Modifier</button>
              <button class="btn-delete" (click)="deleteDisponibilite(d.id!)">Supprimer</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noData>
        <p>Aucune disponibilité enregistrée.</p>
      </ng-template>

      <!-- MODAL -->
      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editing ? 'Modifier' : 'Nouvelle' }} disponibilité</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <form [formGroup]="form" (ngSubmit)="saveDisponibilite()">
              <div class="form-group">
                <label>Date :</label>
                <input
                  type="date"
                  formControlName="date"
                  class="form-control"
                  [min]="today"
                />
                <!-- Messages d'erreur -->
                <div *ngIf="form.get('date')!.invalid && (form.get('date')!.dirty || form.get('date')!.touched)" class="text-danger mt-1">
                  <small *ngIf="form.get('date')!.errors?.['required']">La date est obligatoire.</small>
                  <small *ngIf="form.get('date')!.errors?.['dateInvalid']">La date ne peut pas être antérieure à aujourd’hui.</small>
                </div>
              </div>

              <div class="form-group">
                <label>Heure de début :</label>
                <input
                  type="time"
                  formControlName="heure_debut"
                  class="form-control"
                />
                <div *ngIf="form.get('heure_debut')!.invalid && (form.get('heure_debut')!.dirty || form.get('heure_debut')!.touched)" class="text-danger mt-1">
                  <small *ngIf="form.get('heure_debut')!.errors?.['required']">L'heure de début est obligatoire.</small>
                  <small *ngIf="form.get('heure_debut')!.errors?.['heureDebutInvalid']">L’heure de début doit être supérieure à l’heure actuelle.</small>
                </div>

              </div>


              <div class="form-group">
                <label>Heure de fin :</label>
                <input
                  type="time"
                  formControlName="heure_fin"
                  class="form-control"
                />
                <!-- Messages d'erreur -->
                <div *ngIf="form.get('heure_fin')!.invalid && (form.get('heure_fin')!.dirty || form.get('heure_fin')!.touched)" class="text-danger mt-1">
                  <small *ngIf="form.get('heure_fin')!.errors?.['required']">L'heure de fin est obligatoire.</small>
                  <small *ngIf="form.get('heure_fin')!.errors?.['heureFinInvalid']">L’heure de fin doit être supérieure à l’heure de début.</small>
                </div>
              </div>

              <div class="form-group">
                <label>Durée de consultation (minutes) :</label>
                <input
                  type="number"
                  formControlName="duree_consultation_minutes"
                  class="form-control"
                  readonly
                />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" [disabled]="form.invalid">{{ editing ? 'Modifier' : 'Ajouter' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a237e;
    }
    .btn-primary {
      background: #1565c0;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s;
    }
    .btn-primary:hover {
      background: #0d47a1;
      transform: translateY(-2px);
    }
    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .alert-success {
      background: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }
    .alert-error {
      background: #ffebee;
      color: #c62828;
      border-left: 4px solid #f44336;
    }
    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th, .data-table td {
      padding: 1rem;
      text-align: left;
      color: #333;
    }
    .data-table thead {
      background: #f5f5f5;
    }
    .data-table tbody tr:hover {
      background: #f9f9f9;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-edit, .btn-delete {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-edit {
      background: #e3f2fd;
      color: #1565c0;
    }
    .btn-edit:hover {
      background: #bbdefb;
    }
    .btn-delete {
      background: #ffebee;
      color: #c62828;
    }
    .btn-delete:hover {
      background: #ffcdd2;
    }
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .modal-header, .modal-body {
      padding: 1.5rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
    }
    .form-control:focus {
      outline: none;
      border-color: #1565c0;
    }
    .text-danger {
      color: #dc3545;
      font-size: 0.875rem;
    }
    .mt-1 {
      margin-top: 0.25rem;
    }
    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }
    .btn-secondary {
      background: transparent;
      color: #666;
      border: 2px solid #e0e0e0;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: #f5f5f5;
    }
  `]
})
export class DisponibilitesComponent implements OnInit {
  disponibilites: Disponibilite[] = [];
  showModal = false;
  editing = false;
  successMessage = '';
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];
  form: FormGroup;

  constructor(private dispoService: DisponibilitesService) {
    this.form = new FormGroup({
      id: new FormControl(null),
      date: new FormControl('', [Validators.required, dateValidator]),
      heure_debut: new FormControl('', [Validators.required]),
      heure_fin: new FormControl('', [Validators.required]),
      duree_consultation_minutes: new FormControl({value: 0, disabled: false}), // désactivé => false
    },
      {  validators: [heureDebutValidator, heureFinValidator, consultationHoursValidator]

      });

    // Calcul automatique de la durée
    this.form.valueChanges.subscribe(() => {
      this.calculateDuration();
    });
  }

  ngOnInit(): void {
    this.loadDisponibilites();
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }

  loadDisponibilites(): void {
    this.dispoService.getAll().subscribe({
      next: (data) => this.disponibilites = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des disponibilités.'
    });
  }

  openModal(item?: Disponibilite): void {
    this.showModal = true;
    this.editing = !!item;

    if (item) {
      this.form.patchValue(item);
    } else {
      this.form.reset({
        id: null,
        date: '',
        heure_debut: '',
        heure_fin: '',
        duree_consultation_minutes: 0
      });
    }
  }

  calculateDuration(): void {
    const heureDebut = this.form.get('heure_debut')?.value;
    const heureFin = this.form.get('heure_fin')?.value;
    if (heureDebut && heureFin) {
      const start = toMinutes(heureDebut);
      const end = toMinutes(heureFin);
      if (end > start) {
        this.form.get('duree_consultation_minutes')?.setValue(end - start);
      } else {
        this.form.get('duree_consultation_minutes')?.setValue(0);
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.form.reset();
  }

  saveDisponibilite(): void {
    if (this.form.invalid) return;
    // Construire payload en forçant la valeur désactivée à être incluse
    const payload = {
      ...this.form.getRawValue(),  // getRawValue inclut les champs désactivés
      heure_debut: this.formatTime(this.form.value.heure_debut),
      heure_fin: this.formatTime(this.form.value.heure_fin)
    };

    if (this.editing && this.form.value.id) {
      this.dispoService.update(this.form.value.id, payload).subscribe({
        next: () => {
          this.showSuccess('Disponibilité modifiée avec succès');
          this.loadDisponibilites();
          this.closeModal();
        },
        error: (err) => this.showError('Erreur lors de la mise à jour : ' + JSON.stringify(err.error))
      });
    } else {
      this.dispoService.create(payload).subscribe({
        next: () => {
          this.showSuccess('Disponibilité ajoutée avec succès');
          this.loadDisponibilites();
          this.closeModal();
        },
        error: (err) => this.showError('Erreur lors de l’ajout : ' + JSON.stringify(err.error))
      });
    }
  }

  deleteDisponibilite(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer cette disponibilité ?')) return;
    this.dispoService.delete(id).subscribe({
      next: () => {
        this.showSuccess('Disponibilité supprimée');
        this.loadDisponibilites();
      },
      error: () => this.showError('Erreur lors de la suppression')
    });
  }
}
