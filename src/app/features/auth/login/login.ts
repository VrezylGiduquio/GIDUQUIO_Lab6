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

  const data: LoginRequest = this.loginForm.value;

  this.authService.login(data).subscribe({
    next: (res) => {
      console.log('LOGIN SUCCESS', res);
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      console.error(err);
    }
  });
}
}
