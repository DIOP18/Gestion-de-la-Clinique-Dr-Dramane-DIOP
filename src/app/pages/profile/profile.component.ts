import { Component, OnInit } from '@angular/core';
import { UserAccount } from '../../models/user.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {ProfileService} from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: UserAccount = {
    id: 0,
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    image: '',
    email: '',
    gender: 'M',
    role: 'ADMINISTRATEUR',
    is_blocked: false
  };

  // Copie pour annulation
  originalUser: UserAccount = { ...this.user };

  loading: boolean = false;
  saving: boolean = false;
  isEditing: boolean = false;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  // Mot de passe
  showPasswordSection: boolean = false;
  passwordData = {
    current_password: '',
    new_password: ''
  };

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.user = { ...this.user, ...data };
        this.originalUser = { ...this.user }; // Sauvegarde pour annulation
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showError('Erreur lors du chargement du profil');
      }
    });
  }

  getImageUrl(imagePath: string | null): string {
    if (!imagePath) return 'https://ui-avatars.com/api/?name=User&background=1565c0&color=fff&size=200';
    return `http://localhost:8000/storage/${imagePath}`;
  }

  // Activer le mode édition
  enableEdit() {
    this.isEditing = true;
    this.originalUser = { ...this.user }; // Sauvegarder l'état actuel
  }

  // Sauvegarder le profil
  saveProfile() {
    this.saving = true;
    this.profileService.updateProfile(this.user).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.originalUser = { ...updatedUser };
        this.saving = false;
        this.isEditing = false;
        this.showSuccess(' Profil mis à jour avec succès !');
      },
      error: (err) => {
        this.saving = false;
        this.showError('❌ Erreur lors de la mise à jour');
      }
    });
  }

  // Annuler les modifications
  cancelEdit() {
    this.user = { ...this.originalUser }; // Restaurer les valeurs originales
    this.isEditing = false;
  }

  // Changer l'avatar
  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.saving = true;
    this.profileService.updateAvatar(file).subscribe({
      next: (res) => {
        this.user.image = res.image;
        this.saving = false;
        this.showSuccess('✅ Photo de profil mise à jour !');
      },
      error: (err) => {
        this.saving = false;
        this.showError('❌ Erreur lors du téléchargement de la photo');
      }
    });
  }

  // Changer le mot de passe
  changePassword() {
    if (!this.passwordData.current_password || !this.passwordData.new_password) {
      this.showError('Veuillez remplir tous les champs');
      return;
    }

    if (this.passwordData.new_password.length < 8) {
      this.showError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.saving = true;
    this.profileService.updatePassword(
      this.passwordData.current_password,
      this.passwordData.new_password
    ).subscribe({
      next: () => {
        this.saving = false;
        this.passwordData = { current_password: '', new_password: '' };
        this.showPasswordSection = false;
        this.showSuccess('✅ Mot de passe modifié avec succès !');
      },
      error: (err) => {
        this.saving = false;
        const message = err.error?.message || 'Mot de passe actuel incorrect';
        this.showError(`❌ ${message}`);
      }
    });
  }

  // Afficher message de succès
  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 4000);
  }

  // Afficher message d'erreur
  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 4000);
  }
}
