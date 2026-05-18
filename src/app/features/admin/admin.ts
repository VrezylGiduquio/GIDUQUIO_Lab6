import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/services/auth.service';
import { User } from '../../core/auth/models/user.model';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  accounts: User[] = [];
  selectedAccount: User | null = null;
  accountForm: ReturnType<FormBuilder['group']>;
  errorMessage = '';
  detailErrorMessage = '';
  detailSuccessMessage = '';
  isLoading = true;
  isLoadingAccount = false;
  isSavingAccount = false;
  deletingId = '';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.accountForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['User', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.getAccounts().subscribe({
      next: (accounts) => {
        this.isLoading = false;
        this.accounts = Array.isArray(accounts) ? accounts : [];

        if (!Array.isArray(accounts)) {
          this.errorMessage = 'Accounts response was not in the expected format';
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Unable to load accounts';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectAccount(account: User): void {
    this.selectedAccount = account;
    this.detailErrorMessage = '';
    this.detailSuccessMessage = '';
    this.isLoadingAccount = false;
    this.accountForm.patchValue({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role
    });
    this.cdr.detectChanges();
  }

  saveAccount(): void {
    if (!this.selectedAccount || this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.detailErrorMessage = '';
    this.detailSuccessMessage = '';
    this.isSavingAccount = true;

    const updatedAccount: User = {
      ...this.selectedAccount,
      ...this.accountForm.value
    };

    this.authService.updateAccount(updatedAccount).subscribe({
      next: (account) => {
        this.selectedAccount = account;
        this.accounts = this.accounts.map(item =>
          item.id === account.id ? account : item
        );
        this.detailSuccessMessage = 'Account updated';
        this.isSavingAccount = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.detailErrorMessage = err.error?.message || err.message || 'Unable to update account';
        this.isSavingAccount = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeAccount(account: User): void {
    this.deletingId = account.id;
    this.errorMessage = '';

    this.authService.deleteAccount(account.id).subscribe({
      next: () => {
        this.accounts = this.accounts.filter(item => item.id !== account.id);
        if (this.selectedAccount?.id === account.id) {
          this.selectedAccount = null;
          this.accountForm.reset({
            firstName: '',
            lastName: '',
            email: '',
            role: 'User'
          });
        }
        this.deletingId = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Unable to delete account';
        this.deletingId = '';
        this.cdr.detectChanges();
      }
    });
  }
}
