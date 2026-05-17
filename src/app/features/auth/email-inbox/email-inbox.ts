import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/services/auth.service';
import { FakeEmail } from '../../../core/auth/models/fake-email.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-email-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-inbox.html',
  styleUrl: './email-inbox.scss'
})
export class EmailInbox {

  emails$: Observable<FakeEmail[]>;

  constructor(private authService: AuthService) {
    this.emails$ = this.authService.emails$;
  }
}