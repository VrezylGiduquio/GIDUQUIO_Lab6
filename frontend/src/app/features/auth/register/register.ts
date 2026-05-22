import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  registerForm: ReturnType<FormBuilder['group']>;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(private fb: FormBuilder,
  private authService: AuthService,
  private router: Router) {

    this.registerForm = this.fb.group({

      firstName: [
        '',
        [
          Validators.required
        ]
      ],

      lastName: [
        '',
        [
          Validators.required
        ]
      ],

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
      ],

      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ]
    });
  }

  onSubmit(): void {

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
    this.errorMessage = 'Passwords do not match';
    return;
  }

  this.errorMessage = '';
  this.successMessage = '';
  this.isSubmitting = true;

  const formValue = this.registerForm.value;

  const request = {
    firstName: formValue.firstName!,
    lastName: formValue.lastName!,
    email: formValue.email!,
    password: formValue.password!
  };

  this.authService.register(request).subscribe({
    next: (response) => {
      this.isSubmitting = false;
      this.successMessage = response.message;
      this.router.navigate(['/emails']);
    },
    error: (err) => {
      this.isSubmitting = false;
      this.errorMessage = err.error?.message || err.message || 'Registration failed';
    }
  });
}
}
