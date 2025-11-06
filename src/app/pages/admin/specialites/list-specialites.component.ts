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
          Ajouter une spécialité
        </button>
      </div>

      <div class="alert alert-success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

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
            <td>{{ specialite.label }}</td>
            <td>{{ specialite.prix | number }}</td>
            <td>{{ specialite.created_at | date:'dd/MM/yyyy' }}</td>
            <td class="actions">
              <button class="btn-edit" (click)="editSpecialite(specialite)">Modifier</button>
              <button class="btn-delete" (click)="deleteSpecialite(specialite)">Supprimer</button>
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
            <form (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="label">Libellé *</label>
                <input type="text" id="label" [(ngModel)]="formData.label" name="label" required class="form-control" />
              </div>

              <div class="form-group">
                <label for="prix">Prix consultation (XOF) *</label>
                <input type="number" id="prix" [(ngModel)]="formData.prix" name="prix" required min="0" class="form-control" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" [disabled]="loading">
                  {{ loading ? 'En cours...' : (isEdit ? 'Modifier' : 'Ajouter') }}
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

      &:hover {
        background: #0d47a1;
        transform: translateY(-2px);
      }
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;

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
    }

    .btn-edit {
      background: #e3f2fd;
      color: #1565c0;

      &:hover {
        background: #bbdefb;
      }
    }

    .btn-delete {
      background: #ffebee;
      color: #c62828;

      &:hover {
        background: #ffcdd2;
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
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { label: '', prix: 0 };
    this.selectedId = null;
  }

  editSpecialite(specialite: Specialite): void {
    this.showModal = true;
    this.isEdit = true;
    this.selectedId = specialite.id;
    this.formData = { label: specialite.label, prix: specialite.prix };
  }

  onSubmit(): void {
    if (!this.formData.label.trim() || this.formData.prix <= 0) return;

    this.loading = true;
    const operation = this.isEdit && this.selectedId
      ? this.specialiteService.update(this.selectedId, this.formData)
      : this.specialiteService.create(this.formData);

    operation.subscribe({
      next: () => {
        this.showSuccess(this.isEdit ? 'Spécialité modifiée' : 'Spécialité ajoutée');
        this.closeModal();
        this.loadSpecialites();
        this.loading = false;
      },
      error: (error) => {
        this.showError(error.error?.message || 'Une erreur est survenue');
        this.loading = false;
      }
    });
  }

  deleteSpecialite(specialite: Specialite): void {
    if (!confirm(`Supprimer "${specialite.label}" ?`)) return;

    this.specialiteService.delete(specialite.id).subscribe({
      next: () => {
        this.showSuccess('Spécialité supprimée');
        this.loadSpecialites();
      },
      error: () => this.showError('Erreur lors de la suppression')
    });
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }
}
