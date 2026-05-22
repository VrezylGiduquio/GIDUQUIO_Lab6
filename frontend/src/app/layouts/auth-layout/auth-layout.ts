import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
   constructor(
    private authService: AuthService,
    private router: Router
  ) {}

ngOnInit() {
  if (this.authService.getCurrentUser()) {
    this.router.navigate(['/dashboard']);
  }
}

}
