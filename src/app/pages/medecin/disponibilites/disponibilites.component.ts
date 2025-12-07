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

  if (heureDebut) {
    const minTime = 8 * 60;     // 8h00 en minutes
    const maxTime = 18 * 60;    // 18h00 en minutes
    const start = toMinutes(heureDebut);

    // Vérifier que l'heure de début est >= 8h
    if (start < minTime) {
      return { heureDebutTropTot: true };
    }

    // Vérifier que l'heure de début est < 18h
    if (start >= maxTime) {
      return { heureDebutTropTard: true };
    }
  }

  if (heureFin) {
    const maxTime = 18 * 60;    // 18h00 en minutes
    const end = toMinutes(heureFin);

    // Vérifier que l'heure de fin est <= 18h
    if (end > maxTime) {
      return { heureFinTropTard: true };
    }
  }

  if (heureDebut && heureFin) {
    const start = toMinutes(heureDebut);
    const end = toMinutes(heureFin);
    const duree = end - start;

    // Validation durée minimale de 10 minutes
    if (duree < 10) {
      return { dureeTropCourte: true };
    }

    // Validation durée maximale de 30 minutes
    if (duree > 30) {
      return { dureeTropLongue: true };
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
            <td>{{ d.date | date:'dd/MM/yyyy' }}</td>
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
        <p class="no-data">Aucune disponibilité enregistrée.</p>
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
                <div *ngIf="form.get('date')!.invalid && (form.get('date')!.dirty || form.get('date')!.touched)" class="text-danger mt-1">
                  <small *ngIf="form.get('date')!.errors?.['required']">La date est obligatoire.</small>
                  <small *ngIf="form.get('date')!.errors?.['dateInvalid']">La date ne peut pas être antérieure à aujourd'hui.</small>
                </div>
              </div>

              <div class="form-group">
                <label>Heure de début : <span class="hint">(entre 08:00 et 17:59)</span></label>
                <input
                  type="time"
                  formControlName="heure_debut"
                  class="form-control"
                  min="08:00"
                  max="17:59"
                />
                <div *ngIf="form.get('heure_debut')!.invalid && (form.get('heure_debut')!.dirty || form.get('heure_debut')!.touched)" class="text-danger mt-1">
                  <small *ngIf="form.get('heure_debut')!.errors?.['required']">L'heure de début est obligatoire.</small>
                  <small *ngIf="form.get('heure_debut')!.errors?.['heureDebutInvalid']">L'heure de début doit être supérieure à l'heure actuelle.</small>
                </div>
                <div *ngIf="form.errors?.['heureDebutTropTot']" class="text-danger mt-1">
                  <small>L'heure de début doit être au minimum 08:00.</small>
                </div>
                <div *ngIf="form.errors?.['heureDebutTropTard']" class="text-danger mt-1">
                  <small>L'heure de début doit être inférieure à 18:00.</small>
                </div>
              </div>

              <div class="form-group">
                <label>Heure de fin : <span class="hint">(maximum 18:00)</span></label>
                <input
                  type="time"
                  formControlName="heure_fin"
                  class="form-control"
                  min="08:00"
                  max="18:00"
                  [disabled]="isHeureFinDisabled()"
                />
                <div *ngIf="isHeureFinDisabled()" class="text-warning mt-1">
                  <small> L'heure de début doit être inférieure à 18:00 pour définir une heure de fin.</small>
                </div>
                <div *ngIf="form.get('heure_fin')!.invalid && (form.get('heure_fin')!.dirty || form.get('heure_fin')!.touched)" class="text-danger mt-1">
                  <small *ngIf="form.get('heure_fin')!.errors?.['required']">L'heure de fin est obligatoire.</small>
                  <small *ngIf="form.get('heure_fin')!.errors?.['heureFinInvalid']">L'heure de fin doit être supérieure à l'heure de début.</small>
                </div>
                <div *ngIf="form.errors?.['heureFinTropTard']" class="text-danger mt-1">
                  <small>L'heure de fin doit être au maximum 18:00.</small>
                </div>
                <div *ngIf="form.errors?.['dureeTropCourte']" class="text-danger mt-1">
                  <small>La durée minimale doit être de 10 minutes.</small>
                </div>
                <div *ngIf="form.errors?.['dureeTropLongue']" class="text-danger mt-1">
                  <small>La durée maximale doit être de 30 minutes.</small>
                </div>
              </div>

              <div class="form-group">
                <label>Durée de consultation : <span class="hint">(10-30 minutes)</span></label>
                <input
                  type="number"
                  formControlName="duree_consultation_minutes"
                  class="form-control"
                  readonly
                />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" [disabled]="!isFormValid()">{{ editing ? 'Modifier' : 'Ajouter' }}</button>
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
      transform: none;
    }
    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
    .no-data {
      text-align: center;
      padding: 3rem;
      color: #666;
      font-size: 1.1rem;
    }
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
    .modal-header h2 {
      margin: 0;
      color: #1a237e;
      font-size: 1.5rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      color: #999;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    .close-btn:hover {
      background: #f5f5f5;
      color: #333;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }
    .hint {
      font-size: 0.85rem;
      font-weight: 400;
      color: #666;
    }
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .form-control:focus {
      outline: none;
      border-color: #1565c0;
    }
    .form-control[readonly] {
      background: #f5f5f5;
      cursor: not-allowed;
    }
    .text-danger {
      color: #dc3545;
      font-size: 0.875rem;
    }
    .text-warning {
      color: #ff9800;
      font-size: 0.875rem;
      font-weight: 500;
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
      transition: all 0.3s;
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
      duree_consultation_minutes: new FormControl(0),
    }, {
      validators: [heureDebutValidator, heureFinValidator, consultationHoursValidator]
    });

    // Calcul automatique de la durée
    this.form.valueChanges.subscribe(() => {
      this.calculateDuration();

      // Réinitialiser l'heure de fin si l'heure de début est >= 18h
      const heureDebut = this.form.get('heure_debut')?.value;
      if (heureDebut) {
        const startMinutes = toMinutes(heureDebut);
        if (startMinutes >= 18 * 60) {
          this.form.get('heure_fin')?.setValue('', { emitEvent: false });
          this.form.get('heure_fin')?.disable({ emitEvent: false });
        } else {
          if (this.form.get('heure_fin')?.disabled) {
            this.form.get('heure_fin')?.enable({ emitEvent: false });
          }
        }
      }
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
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  loadDisponibilites(): void {
    this.dispoService.getAll().subscribe({
      next: (data) => this.disponibilites = data,
      error: () => this.showError('Erreur lors du chargement des disponibilités.')
    });
  }

  // Vérifier si un créneau horaire chevauche avec les disponibilités existantes
  checkOverlap(date: string, heureDebut: string, heureFin: string, excludeId?: number): boolean {
    const start = toMinutes(heureDebut);
    const end = toMinutes(heureFin);

    return this.disponibilites.some(dispo => {
      // Ignorer la disponibilité en cours de modification
      if (excludeId && dispo.id === excludeId) {
        return false;
      }

      // Vérifier si c'est la même date
      if (dispo.date !== date) {
        return false;
      }

      const existingStart = toMinutes(dispo.heure_debut);
      const existingEnd = toMinutes(dispo.heure_fin);


      return (
        (start >= existingStart && start < existingEnd) ||
        (end > existingStart && end <= existingEnd) ||
        (start <= existingStart && end >= existingEnd)
      );
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
      try {
        const start = toMinutes(heureDebut);
        const end = toMinutes(heureFin);
        if (end > start) {
          this.form.get('duree_consultation_minutes')?.setValue(end - start, { emitEvent: false });
        } else {
          this.form.get('duree_consultation_minutes')?.setValue(0, { emitEvent: false });
        }
      } catch (e) {
        this.form.get('duree_consultation_minutes')?.setValue(0, { emitEvent: false });
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.form.reset();
    this.form.get('heure_fin')?.enable(); // Réactiver le champ
  }

  isHeureFinDisabled(): boolean {
    const heureDebut = this.form.get('heure_debut')?.value;
    if (!heureDebut) return false;
    try {
      return toMinutes(heureDebut) >= 18 * 60;
    } catch (e) {
      return false;
    }
  }

  isFormValid(): boolean {
    // Vérifier que tous les champs requis sont remplis
    const date = this.form.get('date')?.value;
    const heureDebut = this.form.get('heure_debut')?.value;
    const heureFin = this.form.get('heure_fin')?.value;

    if (!date || !heureDebut || !heureFin) {
      return false;
    }

    // Vérifier qu'il n'y a pas d'erreurs de validation sur le formulaire
    // en ignorant les champs désactivés
    if (this.form.get('date')?.invalid) return false;
    if (this.form.get('heure_debut')?.invalid) return false;
    if (this.form.get('heure_fin')?.invalid && !this.form.get('heure_fin')?.disabled) return false;

    // Vérifier les erreurs au niveau du formulaire
    if (this.form.errors) {
      return false;
    }

    return true;
  }

  saveDisponibilite(): void {
    if (this.form.invalid) {
      this.showError('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    const formValue = this.form.getRawValue();
    const date = formValue.date;
    const heureDebut = this.formatTime(formValue.heure_debut);
    const heureFin = this.formatTime(formValue.heure_fin);

    // Vérifier les chevauchements
    const hasOverlap = this.checkOverlap(date, heureDebut, heureFin, formValue.id);

    if (hasOverlap) {
      this.showError('Cette plage horaire chevauche avec une disponibilité existante. Veuillez choisir un autre créneau.');
      return;
    }

    // Construire payload
    const payload = {
      ...formValue,
      heure_debut: heureDebut,
      heure_fin: heureFin
    };

    if (this.editing && formValue.id) {
      this.dispoService.update(formValue.id, payload).subscribe({
        next: () => {
          this.showSuccess('Disponibilité modifiée avec succès');
          this.loadDisponibilites();
          this.closeModal();
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || 'Erreur lors de la mise à jour';
          this.showError(errorMsg);
        }
      });
    } else {
      this.dispoService.create(payload).subscribe({
        next: () => {
          this.showSuccess('Disponibilité ajoutée avec succès');
          this.loadDisponibilites();
          this.closeModal();
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || 'Erreur lors de l\'ajout';
          this.showError(errorMsg);
        }
      });
    }
  }

  deleteDisponibilite(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer cette disponibilité ?')) return;
    this.dispoService.delete(id).subscribe({
      next: () => {
        this.showSuccess('Disponibilité supprimée avec succès');
        this.loadDisponibilites();
      },
      error: () => this.showError('Erreur lors de la suppression')
    });
  }
}
