import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  require2FA = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      two_factor_code: ['']
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.two_factor_required) {
            this.require2FA = true;
            this.loading = false;
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Une erreur est survenue';
        }
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
