import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      description: ['', [Validators.required]],
      gender: ['', [Validators.required]]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid && this.selectedImage) {
      this.loading = true;
      this.errorMessage = '';

      const registerData = {
        ...this.registerForm.value,
        image: this.selectedImage
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          // Redirection automatique via le service
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Une erreur est survenue';
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs et ajouter une photo';
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
