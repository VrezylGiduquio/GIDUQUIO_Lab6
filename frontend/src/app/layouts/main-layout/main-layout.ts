import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {

  constructor(
  private authService: AuthService,
  private router: Router
) {}

get user() {
  return this.authService.getCurrentUser();
}

logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']);
}
  
}
