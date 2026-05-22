import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss'
})
export class VerifyEmail implements OnInit {
  isLoading = true;
  isSuccess = false;
  message = 'Verifying account...';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.message = 'Missing verification token';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.authService.clearEmailPreview();
        this.authService.clearPendingVerificationEmail();
        this.isLoading = false;
        this.isSuccess = true;
        this.message = 'Account verified successfully. You can now sign in.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.message = err.error?.message || err.message || 'Invalid verification token';
      }
    });
  }
}
