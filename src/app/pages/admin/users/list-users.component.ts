// src/app/pages/admin/users/list-users.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { SpecialiteService } from '../../../services/specialite.service';
import { Specialite } from '../../../models/specialite.model';
import { Assistant, Doctor, UserAccount } from '../../../models/user.models';
import { Observable } from 'rxjs';

type UserType = 'ADMINISTRATEUR' | 'MEDECIN' | 'ASSISTANT';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Gestion des Comptes</h1>
        <button class="btn-primary" (click)="openModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Ajouter un utilisateur
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

      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'all'" (click)="switchTab('all')">
          Tous les utilisateurs
        </button>
        <button class="tab" [class.active]="activeTab === 'medecins'" (click)="switchTab('medecins')">
          Médecins
        </button>
        <button class="tab" [class.active]="activeTab === 'assistants'" (click)="switchTab('assistants')">
          Assistants
        </button>
      </div>

      <div class="table-container" *ngIf="activeTab === 'all'">
        <table class="data-table">
          <thead>
          <tr>
            <th>Photo</th>
            <th>Nom complet</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Téléphone</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let user of users">
            <td><img [src]="getImageUrl(user.image)" alt="Profile" class="avatar"></td>
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td>{{ user.email }}</td>
            <td><span class="badge" [class]="'badge-' + user.role.toLowerCase()">{{ user.role }}</span></td>
            <td>{{ user.phone }}</td>
            <td>
                <span class="status" [class.blocked]="user.is_blocked">
                  {{ user.is_blocked ? 'Bloqué' : 'Actif' }}
                </span>
            </td>
            <td class="actions">
              <button
                class="btn-icon"
                [class.btn-unblock]="user.is_blocked"
                (click)="toggleBlock(user)"
                [title]="user.is_blocked ? 'Débloquer' : 'Bloquer'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect *ngIf="!user.is_blocked" x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path *ngIf="!user.is_blocked" d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  <rect *ngIf="user.is_blocked" x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path *ngIf="user.is_blocked" d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
                {{ user.is_blocked ? 'Débloquer' : 'Bloquer' }}
              </button>
              <button class="btn-icon btn-delete" (click)="deleteUser(user)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Supprimer
              </button>
            </td>
          </tr>
          <tr *ngIf="users.length === 0">
            <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">Aucun utilisateur trouvé</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="table-container" *ngIf="activeTab === 'medecins'">
        <table class="data-table">
          <thead>
          <tr>
            <th>Photo</th>
            <th>Nom complet</th>
            <th>Email</th>
            <th>N° Ordre</th>
            <th>Spécialité</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let doctor of doctors">
            <td><img [src]="getImageUrl(doctor.user?.image)" alt="Profile" class="avatar"></td>
            <td>{{ doctor.user?.first_name }} {{ doctor.user?.last_name }}</td>
            <td>{{ doctor.user?.email }}</td>
            <td><span class="badge badge-numero">{{ doctor.num_ordre }}</span></td>
            <td><span class="badge badge-specialite">{{ doctor.specialty?.label }}</span></td>
            <td>
                <span class="status" [class.blocked]="doctor.user?.is_blocked">
                  {{ doctor.user?.is_blocked ? 'Bloqué' : 'Actif' }}
                </span>
            </td>
            <td class="actions">
              <button
                class="btn-icon"
                [class.btn-unblock]="doctor.user?.is_blocked"
                (click)="toggleBlockDoctor(doctor)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {{ doctor.user?.is_blocked ? 'Débloquer' : 'Bloquer' }}
              </button>
            </td>
          </tr>
          <tr *ngIf="doctors.length === 0">
            <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">Aucun médecin trouvé</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="table-container" *ngIf="activeTab === 'assistants'">
        <table class="data-table">
          <thead>
          <tr>
            <th>Photo</th>
            <th>Nom complet</th>
            <th>Email</th>
            <th>N° Employé</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let assistant of assistants">
            <td><img [src]="getImageUrl(assistant.user?.image)" alt="Profile" class="avatar"></td>
            <td>{{ assistant.user?.first_name }} {{ assistant.user?.last_name }}</td>
            <td>{{ assistant.user?.email }}</td>
            <td><span class="badge badge-numero">{{ assistant.num_employe }}</span></td>
            <td>
                <span class="status" [class.blocked]="assistant.user?.is_blocked">
                  {{ assistant.user?.is_blocked ? 'Bloqué' : 'Actif' }}
                </span>
            </td>
            <td class="actions">
              <button
                class="btn-icon"
                [class.btn-unblock]="assistant.user?.is_blocked"
                (click)="toggleBlockAssistant(assistant)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {{ assistant.user?.is_blocked ? 'Débloquer' : 'Bloquer' }}
              </button>
            </td>
          </tr>
          <tr *ngIf="assistants.length === 0">
            <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">Aucun assistant trouvé</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ isEdit ? 'Modifier' : 'Ajouter' }} un utilisateur</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="user-type-selector" *ngIf="!selectedUserType">
              <h3>Sélectionnez le type d'utilisateur</h3>
              <div class="type-cards">
                <div class="type-card" (click)="selectUserType('ADMINISTRATEUR')">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1565c0">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  <h4>Administrateur</h4>
                  <p>Accès complet au système</p>
                </div>
                <div class="type-card" (click)="selectUserType('MEDECIN')">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2e7d32">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <h4>Médecin</h4>
                  <p>Gestion des consultations</p>
                </div>
                <div class="type-card" (click)="selectUserType('ASSISTANT')">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7b1fa2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h4>Assistant</h4>
                  <p>Gestion des rendez-vous</p>
                </div>
              </div>
            </div>


            <form *ngIf="selectedUserType" (ngSubmit)="onSubmit()" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label>Prénom *</label>
                  <input type="text" [(ngModel)]="formData.first_name" name="first_name" class="form-control" required>
                </div>
                <div class="form-group">
                  <label>Nom *</label>
                  <input type="text" [(ngModel)]="formData.last_name" name="last_name" class="form-control" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    [(ngModel)]="formData.email"
                    name="email"
                    class="form-control"
                    (blur)="validateEmail()"
                    required>
                  <small class="error-text" *ngIf="emailError">{{ emailError }}</small>
                </div>
                <div class="form-group">
                  <label>Mot de passe *</label>
                  <div class="password-input">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      [(ngModel)]="formData.password"
                      name="password"
                      class="form-control"
                      (blur)="validatePassword()"
                      required>
                    <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                      <svg *ngIf="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <svg *ngIf="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                  <small class="error-text" *ngIf="passwordError">{{ passwordError }}</small>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    [(ngModel)]="formData.phone"
                    name="phone"
                    class="form-control"
                    (blur)="validatePhone()"
                    required>
                  <small class="error-text" *ngIf="phoneError">{{ phoneError }}</small>
                </div>
                <div class="form-group">
                  <label>Genre *</label>
                  <select [(ngModel)]="formData.gender" name="gender" class="form-control" required>
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Adresse *</label>
                <input type="text" [(ngModel)]="formData.address" name="address" class="form-control" required>
              </div>

              <div *ngIf="selectedUserType === 'MEDECIN'" class="form-group">
                <label>Description *</label>
                <textarea [(ngModel)]="formData.description" name="description" class="form-control" rows="3" required></textarea>
              </div>

              <div *ngIf="selectedUserType === 'MEDECIN'" class="form-group">
                <label>Spécialité *</label>
                <select [(ngModel)]="formData.specialty_id" name="specialty_id" class="form-control" required>
                  <option value="">Sélectionner</option>
                  <option *ngFor="let spec of specialites" [value]="spec.id">{{ spec.label }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Photo de profil {{ isEdit ? '' : '*' }}</label>
                <input type="file" accept="image/*" (change)="onFileSelected($event)" class="form-control" [required]="!isEdit">
                <div class="image-preview" *ngIf="imagePreview">
                  <img [src]="imagePreview" alt="Preview">
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" [disabled]="loading || emailError || phoneError || passwordError">
                  <span *ngIf="!loading">{{ isEdit ? 'Modifier' : 'Créer' }} l'utilisateur</span>
                  <span *ngIf="loading">{{ isEdit ? 'Modification' : 'Création' }} en cours...</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #1a237e; margin: 0; }
    .btn-primary { background: #1565c0; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s; }
    .btn-primary:hover:not(:disabled) { background: #0d47a1; transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert { padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 500; }
    .alert-success { background: #e8f5e9; color: #2e7d32; border-left: 4px solid #4caf50; }
    .alert-error { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: white; padding: 0.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab { padding: 0.75rem 1.5rem; border: none; background: transparent; color: #666; font-weight: 500; cursor: pointer; border-radius: 6px; transition: all 0.3s; }
    .tab.active { background: #e3f2fd; color: #1565c0; }
    .table-container { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead { background: #f5f5f5; }
    .data-table th { padding: 1rem; text-align: left; font-weight: 600; color: #333; }
    .data-table tbody tr { border-top: 1px solid #e0e0e0; transition: background 0.3s; }
    .data-table tbody tr:hover { background: #f9f9f9; }
    .data-table td { padding: 1rem; color: #666; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    .badge-administrateur { background: #e3f2fd; color: #1565c0; }
    .badge-medecin { background: #e8f5e9; color: #2e7d32; }
    .badge-assistant { background: #f3e5f5; color: #7b1fa2; }
    .badge-specialite { background: #f3e5f5; color: #7b1fa2; }
    .badge-numero { background: #fff3e0; color: #e65100; }
    .status { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
    .status.blocked { background: #ffebee; color: #c62828; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-icon { padding: 0.5rem 1rem; border-radius: 6px; border: none; background: #e3f2fd; color: #1565c0; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; transition: all 0.3s; }
    .btn-icon:hover { background: #bbdefb; transform: translateY(-2px); }
    .btn-icon.btn-unblock { background: #e8f5e9; color: #2e7d32; }
    .btn-icon.btn-unblock:hover { background: #c8e6c9; }
    .btn-icon.btn-delete { background: #ffebee; color: #c62828; }
    .btn-icon.btn-delete:hover { background: #ffcdd2; }
    .btn-icon.btn-edit { background: #fff3e0; color: #e65100; }
    .btn-icon.btn-edit:hover { background: #ffe0b2; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
    .modal-large { max-width: 800px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e0e0e0; }
    .modal-header h2 { margin: 0; color: #1a237e; }
    .close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: #666; }
    .modal-body { padding: 1.5rem; }
    .user-type-selector h3 { text-align: center; margin-bottom: 2rem; color: #333; }
    .type-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .type-card { padding: 2rem 1rem; border: 2px solid #e0e0e0; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s; }
    .type-card:hover { border-color: #1565c0; transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
    .type-card svg { margin-bottom: 1rem; }
    .type-card h4 { margin: 0.5rem 0; color: #333; }
    .type-card p { color: #666; font-size: 0.85rem; margin: 0; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem; }
    .form-control { width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
    .form-control:focus { outline: none; border-color: #1565c0; }
    .password-input { position: relative; }
    .toggle-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #666; }
    .image-preview { margin-top: 1rem; text-align: center; }
    .image-preview img { max-width: 200px; border-radius: 8px; }
    .modal-footer { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
    .btn-secondary { background: transparent; color: #666; border: 2px solid #e0e0e0; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .error-text { color: #c62828; font-size: 0.85rem; margin-top: 0.25rem; display: block; }
    @media (max-width: 768px) { .type-cards, .form-row { grid-template-columns: 1fr; } }
  `]
})
export class ListUsersComponent implements OnInit {
  users: UserAccount[] = [];
  doctors: Doctor[] = [];
  assistants: Assistant[] = [];
  specialites: Specialite[] = [];
  activeTab: 'all' | 'medecins' | 'assistants' = 'all';
  showModal = false;
  loading = false;
  showPassword = false;
  successMessage = '';
  errorMessage = '';
  selectedUserType: UserType | null = null;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  formData: any = { gender: '', specialty_id: null };
  isEdit = false;
  editUserId: number | null = null;
  userForm!: FormGroup;

  // Variables pour les erreurs de validation
  emailError = '';
  phoneError = '';
  passwordError = '';


  constructor(
    private userService: UserService,
    private specialiteService: SpecialiteService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadSpecialites();
  }

  switchTab(tab: 'all' | 'medecins' | 'assistants'): void {
    this.activeTab = tab;
    if (tab === 'medecins') this.loadDoctors();
    if (tab === 'assistants') this.loadAssistants();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res) => { this.users = res.data; },
      error: () => { this.showError('Erreur de chargement des utilisateurs'); }
    });
  }

  loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (res) => { this.doctors = res.data; },
      error: () => { this.showError('Erreur de chargement des médecins'); }
    });
  }

  loadAssistants(): void {
    this.userService.getAssistants().subscribe({
      next: (res) => { this.assistants = res.data; },
      error: () => { this.showError('Erreur de chargement des assistants'); }
    });
  }

  loadSpecialites(): void {
    this.specialiteService.getAll().subscribe({
      next: (data) => { this.specialites = data; },
      error: () => {}
    });
  }

  openModal(): void {
    this.showModal = true;
    this.selectedUserType = null;
    this.isEdit = false;
    this.editUserId = null;
    this.formData = { gender: '', specialty_id: null };
    this.imagePreview = null;
    this.showPassword = false;
    this.selectedImage = null;
    this.emailError = '';
    this.phoneError = '';
    this.passwordError = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.isEdit = false;
    this.editUserId = null;
  }

  editUser(user: UserAccount): void {
    this.isEdit = true;
    this.editUserId = user.id;
    this.selectedUserType = user.role as UserType;
    this.formData = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      role: user.role,
      specialty_id: null,
      description: ''
    };
    this.imagePreview = this.getImageUrl(user.image);
    this.showModal = true;
  }

  selectUserType(type: UserType): void {
    this.selectedUserType = type;
    this.formData.role = type;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagePreview = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    // Validation de l'image
    if (!this.selectedImage && !this.isEdit) {
      this.showError('Veuillez sélectionner une photo de profil');
      return;
    }

    // Validation des champs obligatoires
    if (!this.formData.first_name || !this.formData.last_name ||
      !this.formData.email || !this.formData.phone ||
      !this.formData.address || !this.formData.gender) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du mot de passe (seulement pour création)
    if (!this.isEdit && !this.formData.password) {
      this.showError('Le mot de passe est obligatoire');
      return;
    }

    // Validation de l'email (format et doublon)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.showError('Format d\'email invalide');
      return;
    }

    const emailExists = this.users.some(u =>
      u.email.toLowerCase() === this.formData.email.toLowerCase() &&
      (!this.isEdit || u.id !== this.editUserId)
    );
    if (emailExists) {
      this.showError('Cet email est déjà utilisé par un autre compte');
      return;
    }

    // Validation du téléphone (doublon)
    const phoneExists = this.users.some(u =>
      u.phone === this.formData.phone &&
      (!this.isEdit || u.id !== this.editUserId)
    );
    if (phoneExists) {
      this.showError('Ce numéro de téléphone est déjà utilisé par un autre compte');
      return;
    }

    // Validation du mot de passe (doublon - seulement pour création)
    if (!this.isEdit && this.formData.password) {
      // Note: Cette validation est limitée car on ne peut pas comparer avec les mots de passe hashés
      // On vérifie au moins la longueur minimale
      if (this.formData.password.length < 6) {
        this.showError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    // Validation spécifique pour les médecins
    if (this.selectedUserType === 'MEDECIN') {
      if (!this.formData.description || !this.formData.specialty_id) {
        this.showError('Veuillez remplir la description et la spécialité pour un médecin');
        return;
      }
    }

    this.loading = true;
    this.errorMessage = '';
    const data = { ...this.formData, image: this.selectedImage };

    let operation: Observable<any>;

    if (this.selectedUserType === 'MEDECIN') {
      operation = this.userService.createDoctor(data);
    } else if (this.selectedUserType === 'ASSISTANT') {
      operation = this.userService.createAssistant(data);
    } else {
      operation = this.userService.createUser(data);
    }

    operation.subscribe({
      next: () => {
        this.showSuccess('Utilisateur créé avec succès');
        this.closeModal();
        this.loadUsers();
        if (this.selectedUserType === 'MEDECIN') this.loadDoctors();
        if (this.selectedUserType === 'ASSISTANT') this.loadAssistants();
        this.loading = false;
      },
      error: (err: any) => {
        this.showError(err.error?.message || 'Erreur lors de la création');
        this.loading = false;
      }
    });
  }

  toggleBlock(user: UserAccount): void {
    const action = user.is_blocked ? 'débloquer' : 'bloquer';
    if (!confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) return;

    const operation = user.is_blocked
      ? this.userService.unblockUser(user.id)
      : this.userService.blockUser(user.id);

    operation.subscribe({
      next: (response: any) => {
        if (response.user) {
          // Remplace le user local par celui du backend
          const idx = this.users.findIndex(u => u.id === response.user.id);
          if (idx !== -1) this.users[idx] = response.user;
        } else {
          // Fallback : on inverse localement
          user.is_blocked = !user.is_blocked;
        }
        this.showSuccess(response.message);
      },
      error: (err) => {
        console.error('Erreur block/unblock:', err);
        this.showError(err.error?.message || 'Erreur lors du blocage/déblocage');
      }
    });
  }


  toggleBlockDoctor(doctor: Doctor): void {
    if (!doctor.user) return;
    this.toggleBlock(doctor.user);
  }

  toggleBlockAssistant(assistant: Assistant): void {
    if (!assistant.user) return;
    this.toggleBlock(assistant.user);
  }

  deleteUser(user: UserAccount): void {
    if (!confirm(`ATTENTION : Supprimer définitivement ${user.first_name} ${user.last_name} ?`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: (response) => {
        this.showSuccess(response.message || 'Utilisateur supprimé avec succès');
        this.loadUsers();
        if (this.activeTab === 'medecins') this.loadDoctors();
        if (this.activeTab === 'assistants') this.loadAssistants();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return 'assets/imagemedical.jpg';
    return `http://localhost:8000/storage/${imagePath}`;
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

  // Méthodes de validation en temps réel
  validateEmail(): void {
    this.emailError = '';

    if (!this.formData.email) {
      this.emailError = 'L\'email est obligatoire';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.emailError = 'Format d\'email invalide';
      return;
    }

    const emailExists = this.users.some(u =>
      u.email.toLowerCase() === this.formData.email.toLowerCase() &&
      (!this.isEdit || u.id !== this.editUserId)
    );

    if (emailExists) {
      this.emailError = 'Cet email est déjà utilisé';
    }
  }

  validatePhone(): void {
    this.phoneError = '';

    if (!this.formData.phone) {
      this.phoneError = 'Le téléphone est obligatoire';
      return;
    }

    const phoneExists = this.users.some(u =>
      u.phone === this.formData.phone &&
      (!this.isEdit || u.id !== this.editUserId)
    );

    if (phoneExists) {
      this.phoneError = 'Ce numéro est déjà utilisé';
    }
  }

  validatePassword(): void {
    this.passwordError = '';

    if (this.isEdit && !this.formData.password) {
      return; // Mot de passe optionnel en modification
    }

    if (!this.formData.password) {
      this.passwordError = 'Le mot de passe est obligatoire';
      return;
    }

    if (this.formData.password.length < 6) {
      this.passwordError = 'Minimum 6 caractères requis';
    }
  }
}
