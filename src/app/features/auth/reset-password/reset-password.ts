import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {

  token: string = '';

  resetForm: ReturnType<FormBuilder['group']>;
  errorMessage = '';
  successMessage = '';
  tokenValidated = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {

    this.resetForm = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],
      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ]
    });
  }

  ngOnInit(): void {

    this.token =
      this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'Missing reset token';
      return;
    }

    this.authService.validateResetToken(this.token).subscribe({
      next: () => {
        this.tokenValidated = true;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Invalid or expired reset token';
      }
    });
  }

  onSubmit(): void {

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (this.resetForm.value.password !== this.resetForm.value.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.authService.resetPassword(
      this.token,
      this.resetForm.value.password!,
      this.resetForm.value.confirmPassword!
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Password updated successfully. You can now log in.';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.message || 'Unable to reset password';
      }
    });
  }
}
