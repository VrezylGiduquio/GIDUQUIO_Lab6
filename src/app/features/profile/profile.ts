import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {

  user: any = null;

  profileForm: any;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {

    this.user = this.authService.getCurrentUser();

    this.profileForm = this.fb.group({
      firstName: [this.user?.firstName || '', Validators.required],
      lastName: [this.user?.lastName || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]]
    });
  }

  updateProfile(): void {

    if (this.profileForm.invalid) return;

    const updatedUser = {
      ...this.user,
      ...this.profileForm.value
    };

    this.authService.updateUser(updatedUser);

    this.user = updatedUser;

    alert('Profile updated');
  }
}