import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';
import { DevEmailPreview } from '../../../core/auth/models/dev-email-response.model';

@Component({
  selector: 'app-email-inbox',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './email-inbox.html',
  styleUrl: './email-inbox.scss'
})
export class EmailInbox {
  preview: DevEmailPreview | null;
  pendingEmail: string | null;
  pendingResetEmail: string | null;
  statusMessage = '';
  errorMessage = '';
  isResending = false;

  constructor(private authService: AuthService) {
    this.preview = this.authService.getEmailPreview();
    this.pendingEmail = this.authService.getPendingVerificationEmail();
    this.pendingResetEmail = this.authService.getPendingResetEmail();
  }

  resendEmail(): void {
    const email = this.preview?.to ?? this.pendingResetEmail ?? this.pendingEmail;

    if (!email) {
      this.errorMessage = 'No email preview is available to resend yet.';
      return;
    }

    this.isResending = true;
    this.statusMessage = '';
    this.errorMessage = '';

    const resendRequest = this.isResetPasswordPreview()
      ? this.authService.forgotPassword(email)
      : this.authService.resendVerificationEmail(email);

    resendRequest.subscribe({
      next: (response) => {
        this.preview = this.authService.getEmailPreview();
        this.pendingEmail = this.authService.getPendingVerificationEmail();
        this.pendingResetEmail = this.authService.getPendingResetEmail();
        this.statusMessage = response.message;
        this.isResending = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Unable to resend verification email';
        this.isResending = false;
      }
    });
  }

  isResetPasswordPreview(): boolean {
    return this.preview?.subject === 'Reset your password' || !!this.pendingResetEmail;
  }

  emailActionLabel(): string {
    return this.isResetPasswordPreview()
      ? 'A password reset email was sent to'
      : 'A verification email was sent to';
  }

  resendLabel(): string {
    if (this.isResending) {
      return this.isResetPasswordPreview()
        ? 'Resending reset email...'
        : 'Resending verification email...';
    }

    return this.isResetPasswordPreview()
      ? 'Resend reset email'
      : 'Resend verification email';
  }

  openLinkLabel(): string {
    return this.isResetPasswordPreview()
      ? 'Open reset link'
      : 'Open verification link';
  }
}
