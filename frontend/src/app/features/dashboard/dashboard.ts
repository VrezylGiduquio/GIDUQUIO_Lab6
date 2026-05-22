import { Component } from '@angular/core';

import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  constructor(private authService: AuthService) {}

  get user() {
    return this.authService.getCurrentUser();
  }
}
