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
      ]
    });
  }

  ngOnInit(): void {

    this.token =
      this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const success = this.authService.resetPassword(
      this.token,
      this.resetForm.value.password!
    );

    if (success) {

      alert('Password updated');

      this.router.navigate(['/login']);

    } else {

      alert('Invalid or expired token');
    }
  }
}