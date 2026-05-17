import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  template: `<p>Verifying account...</p>`
})
export class VerifyEmail implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      return;
    }

    const success = this.authService.verifyEmail(token);

    console.log('VERIFY SUCCESS:', success);

    if (success) {
      alert('Account verified successfully');

      this.router.navigate(['/login']);
    } else {
      alert('Invalid verification token');
    }
  }
}