import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpecialiteService } from '../../../services/specialite.service';
import { Specialite } from '../../../models/specialite.model';

@Component({
  selector: 'app-list-specialites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Gestion des Spécialités</h1>
        <button class="btn-primary" (click)="openModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Ajouter une spécialité
        </button>
      </div>

      <div class="alert alert-success" *ngIf="successMessage">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        {{ successMessage }}
      </div>

      <div class="alert alert-error" *ngIf="errorMessage">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        {{ errorMessage }}
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Libellé</th>
            <th>Prix consultation Spécialité</th>
            <th>Date de création</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let specialite of specialites">
            <td>{{ specialite.id }}</td>
            <td>
              <span class="specialite-label">{{ specialite.label }}</span>
            </td>
            <td>
              <span class="prix-badge">{{ specialite.prix | number }} FCFA</span>
            </td>
            <td>{{ specialite.created_at | date:'dd/MM/yyyy' }}</td>
            <td class="actions">
              <button class="btn-edit" (click)="editSpecialite(specialite)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Modifier
              </button>
              <button class="btn-delete" (click)="deleteSpecialite(specialite)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Supprimer
              </button>
            </td>
          </tr>
          <tr *ngIf="specialites.length === 0">
            <td colspan="5" style="text-align: center; padding: 2rem; color: #999;">
              Aucune spécialité trouvée
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ isEdit ? 'Modifier' : 'Ajouter' }} une spécialité</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            <!-- Affichage des erreurs de validation -->


            <form (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="label">Libellé *</label>
                <input
                  type="text"
                  id="label"
                  [(ngModel)]="formData.label"
                  name="label"
                  required
                  class="form-control"
                  [class.input-error]="labelError"
                  (blur)="validateLabel()"
                  placeholder="Ex: Cardiologie, Dermatologie..." />
                <span class="field-error" *ngIf="labelError">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Le libellé est obligatoire
                </span>
              </div>

              <div class="form-group">
                <label for="prix">Prix consultation (FCFA) *</label>
                <input
                  type="number"
                  id="prix"
                  [(ngModel)]="formData.prix"
                  name="prix"
                  required
                  min="3000"
                  class="form-control"
                  [class.input-error]="priceError"
                  (blur)="validatePrice()"
                  (input)="validatePrice()"
                  placeholder="Ex: 3000" />
                <span class="field-error" *ngIf="priceError">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {{ priceErrorMessage }}
                </span>
                <span class="field-hint" *ngIf="!priceError && formData.prix >= 3000">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4M12 8h.01"></path>
                  </svg>
                  Prix valide : {{ formData.prix | number }} FCFA (Minimum: 3000 FCFA)
                </span>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
                <button
                  type="submit"
                  class="btn-primary"
                  [disabled]="loading || hasValidationErrors()">
                  <span *ngIf="!loading">{{ isEdit ? 'Modifier' : 'Ajouter' }}</span>
                  <span *ngIf="loading">{{ isEdit ? 'Modification' : 'Ajout' }} en cours...</span>
                </button>
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

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a237e;
      }
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

      &:hover:not(:disabled) {
        background: #0d47a1;
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .alert {
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;

      &.alert-success {
        background: #e8f5e9;
        color: #2e7d32;
        border-left: 4px solid #4caf50;
      }

      &.alert-error {
        background: #ffebee;
        color: #c62828;
        border-left: 4px solid #f44336;
      }

      &.alert-warning {
        background: #fff3e0;
        color: #e65100;
        border-left: 4px solid #ff9800;
      }
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

      thead {
        background: #f5f5f5;

        th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #333;
        }
      }

      tbody {
        tr {
          border-top: 1px solid #e0e0e0;
          transition: background 0.3s;

          &:hover {
            background: #f9f9f9;
          }

          td {
            padding: 1rem;
            color: #666;

            &.actions {
              display: flex;
              gap: 0.5rem;
            }
          }
        }
      }
    }

    .specialite-label {
      font-weight: 600;
      color: #1565c0;
    }

    .prix-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-edit, .btn-delete {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s;
      font-size: 0.85rem;
    }

    .btn-edit {
      background: #e3f2fd;
      color: #1565c0;

      &:hover {
        background: #bbdefb;
        transform: translateY(-2px);
      }
    }

    .btn-delete {
      background: #ffebee;
      color: #c62828;

      &:hover {
        background: #ffcdd2;
        transform: translateY(-2px);
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        margin: 0;
        color: #1a237e;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #666;

        &:hover {
          color: #333;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: #1565c0;
        }

        &.input-error {
          border-color: #c62828;
          background: #ffebee;
        }
      }
    }

    .field-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #c62828;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      font-weight: 500;

      svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    }

    .field-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #2e7d32;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      font-weight: 500;

      svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;

      .btn-secondary {
        background: transparent;
        color: #666;
        border: 2px solid #e0e0e0;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;

        &:hover {
          background: #f5f5f5;
        }
      }
    }
  `]
})
export class ListSpecialitesComponent implements OnInit {
  specialites: Specialite[] = [];
  showModal = false;
  isEdit = false;
  loading = false;
  successMessage = '';
  errorMessage = '';
  formData = { label: '', prix: 0 };
  selectedId: number | null = null;

  // Validation
  labelError = false;
  priceError = false;
  priceErrorMessage = '';
  validationErrors: string[] = [];
  readonly MAX_PRICE = 3000;

  constructor(private specialiteService: SpecialiteService) {}

  ngOnInit(): void {
    this.loadSpecialites();
  }

  loadSpecialites(): void {
    this.specialiteService.getAll().subscribe({
      next: (data) => this.specialites = data,
      error: () => this.showError('Erreur lors du chargement des spécialités')
    });
  }

  openModal(): void {
    this.showModal = true;
    this.isEdit = false;
    this.formData = { label: '', prix: 0 };
    this.resetValidation();
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { label: '', prix: 0 };
    this.selectedId = null;
    this.resetValidation();
  }

  editSpecialite(specialite: Specialite): void {
    this.showModal = true;
    this.isEdit = true;
    this.selectedId = specialite.id;
    this.formData = { label: specialite.label, prix: specialite.prix };
    this.resetValidation();
  }

  resetValidation(): void {
    this.labelError = false;
    this.priceError = false;
    this.priceErrorMessage = '';
    this.validationErrors = [];
  }

  validateLabel(): void {
    this.labelError = !this.formData.label || this.formData.label.trim() === '';
  }

  validatePrice(): void {
    this.priceError = false;
    this.priceErrorMessage = '';

    if (!this.formData.prix || this.formData.prix <= 0) {
      this.priceError = true;
      this.priceErrorMessage = 'Le prix doit être supérieur à 0 FCFA';
      return;
    }

    if (this.formData.prix < this.MAX_PRICE) {
      this.priceError = true;
      this.priceErrorMessage = `Le prix doit être au minimum ${this.MAX_PRICE} FCFA`;
      return;
    }
  }

  hasValidationErrors(): boolean {
    this.validationErrors = [];
    this.validateLabel();
    this.validatePrice();

    if (this.labelError) {
      this.validationErrors.push('Le libellé est obligatoire');
    }

    if (this.priceError) {
      this.validationErrors.push(this.priceErrorMessage);
    }

    return this.validationErrors.length > 0;
  }

  onSubmit(): void {
    if (this.hasValidationErrors()) {
      this.showError('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    this.loading = true;
    const operation = this.isEdit && this.selectedId
      ? this.specialiteService.update(this.selectedId, this.formData)
      : this.specialiteService.create(this.formData);

    operation.subscribe({
      next: () => {
        this.showSuccess(this.isEdit ? 'Spécialité modifiée avec succès' : 'Spécialité ajoutée avec succès');
        this.closeModal();
        this.loadSpecialites();
        this.loading = false;
      },
      error: (error) => {
        if (error.error?.errors) {
          const backendErrors = error.error.errors;
          if (backendErrors.prix) {
            this.priceError = true;
            this.priceErrorMessage = 'Le prix doit être au minimum 3000 FCFA';
            this.validationErrors = [this.priceErrorMessage];
          }
        }
        this.showError(error.error?.message || 'Une erreur est survenue');
        this.loading = false;
      }
    });
  }

  deleteSpecialite(specialite: Specialite): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la spécialité "${specialite.label}" ?`)) return;

    this.specialiteService.delete(specialite.id).subscribe({
      next: () => {
        this.showSuccess('Spécialité supprimée avec succès');
        this.loadSpecialites();
      },
      error: () => this.showError('Erreur lors de la suppression')
    });
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
}
