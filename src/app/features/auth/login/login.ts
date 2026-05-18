import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth/services/auth.service';
import { LoginRequest } from '../../../core/auth/models/login-request.model';
import { Router } from '@angular/router';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ ReactiveFormsModule,
  RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  loginForm: ReturnType<FormBuilder['group']>;
  errorMessage = '';
  isSubmitting = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {

    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]
    });
  }

  onSubmit(): void {

  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.errorMessage = '';
  this.isSubmitting = true;

  const data: LoginRequest = this.loginForm.value;

  this.authService.login(data).subscribe({
    next: () => {
      this.isSubmitting = false;
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.isSubmitting = false;
      this.errorMessage = err.error?.message || err.message || 'Login failed';
    }
  });
}
}
