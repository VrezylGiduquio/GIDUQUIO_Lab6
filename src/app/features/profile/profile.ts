import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../core/auth/models/user.model';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {

  user: User | null = null;
  profileForm: ReturnType<FormBuilder['group']>;
  passwordForm: ReturnType<FormBuilder['group']>;
  errorMessage = '';
  successMessage = '';
  passwordErrorMessage = '';
  passwordSuccessMessage = '';
  deleteErrorMessage = '';
  deleteSuccessMessage = '';
  isSubmitting = false;
  isChangingPassword = false;
  isDeletingAccount = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {

    this.user = this.authService.getCurrentUser();

    this.profileForm.patchValue({
      firstName: this.user?.firstName || '',
      lastName: this.user?.lastName || '',
      email: this.user?.email || ''
    });
  }

  updateProfile(): void {

    if (!this.user || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    const updatedUser = {
      ...this.user,
      ...this.profileForm.value
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.user = user;
        this.successMessage = 'Profile updated';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.message || 'Unable to update profile';
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (
      this.passwordForm.value.newPassword !==
      this.passwordForm.value.confirmPassword
    ) {
      this.passwordErrorMessage = 'Passwords do not match';
      return;
    }

    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
    this.isChangingPassword = true;

    this.authService.changePassword({
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword: this.passwordForm.value.newPassword!,
      confirmPassword: this.passwordForm.value.confirmPassword!
    }).subscribe({
      next: (response) => {
        this.isChangingPassword = false;
        this.passwordSuccessMessage = response.message;
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.passwordErrorMessage =
          err.error?.message || err.message || 'Unable to change password';
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Delete your account permanently?')) {
      return;
    }

    this.deleteErrorMessage = '';
    this.deleteSuccessMessage = '';
    this.isDeletingAccount = true;

    this.authService.deleteCurrentAccount().subscribe({
      next: () => {
        this.isDeletingAccount = false;
        this.deleteSuccessMessage = 'Account deleted';
        window.location.href = '/login';
      },
      error: (err) => {
        this.isDeletingAccount = false;
        this.deleteErrorMessage =
          err.error?.message || err.message || 'Unable to delete account';
      }
    });
  }
}
