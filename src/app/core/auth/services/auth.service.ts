import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '@environments/environment';

import { AuthResponse } from '../models/auth-response.model';
import { DevEmailPreview, MessageResponse } from '../models/dev-email-response.model';
import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/accounts`;
  private readonly storageKey = 'currentUser';
  private readonly emailPreviewKey = 'devEmailPreview';
  private readonly pendingVerificationEmailKey = 'pendingVerificationEmail';

  private readonly userSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );

  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/authenticate`,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => this.toUser(response)),
      tap(user => this.setSession(user))
    );
  }

  register(data: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(response => {
        this.setPendingVerificationEmail(data.email);
        this.setEmailPreview(response.devEmailPreview);
      })
    );
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/verify-email`, { token });
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password`, { email }).pipe(
      tap(response => this.setEmailPreview(response.devEmailPreview))
    );
  }

  resendVerificationEmail(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/resend-verification`, { email }).pipe(
      tap(response => {
        this.setPendingVerificationEmail(email);
        this.setEmailPreview(response.devEmailPreview);
      })
    );
  }

  validateResetToken(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/validate-reset-token`, { token });
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset-password`, {
      token,
      password,
      confirmPassword
    });
  }

  refreshToken(): Observable<User | null> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/refresh-token`,
      {},
      { withCredentials: true }
    ).pipe(
      map(response => this.toUser(response)),
      tap(user => this.setSession(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  updateProfile(user: User): Observable<User> {
    return this.http.put<AuthResponse>(`${this.baseUrl}/${user.id}`, user).pipe(
      map(response => this.toUser(response)),
      tap(updatedUser => this.setSession(updatedUser))
    );
  }

  getAccount(id: string): Observable<User> {
    return this.http.get<AuthResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.toUser(response))
    );
  }

  updateAccount(user: User): Observable<User> {
    return this.http.put<AuthResponse>(`${this.baseUrl}/${user.id}`, user).pipe(
      map(response => this.toUser(response)),
      tap(updatedUser => {
        if (this.getCurrentUser()?.id === updatedUser.id) {
          this.setSession(updatedUser);
        }
      })
    );
  }

  changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<MessageResponse> {
    const user = this.getCurrentUser();

    if (!user) {
      return of({ message: 'No active session' });
    }

    return this.http.post<MessageResponse>(
      `${this.baseUrl}/${user.id}/change-password`,
      input
    );
  }

  getAccounts(): Observable<User[]> {
    return this.http.get<AuthResponse[]>(this.baseUrl).pipe(
      map(accounts => accounts.map(account => this.toUser(account)))
    );
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  deleteCurrentAccount(): Observable<void> {
    const user = this.getCurrentUser();

    if (!user) {
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/${user.id}`).pipe(
      tap(() => this.clearSession())
    );
  }

  logout(): void {
    this.http.post<void>(
      `${this.baseUrl}/revoke-token`,
      {},
      { withCredentials: true }
    ).pipe(
      catchError(() => of(void 0))
    ).subscribe();

    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  hasStoredSession(): boolean {
    return this.getCurrentUser() !== null;
  }

  getAccessToken(): string | null {
    return this.userSubject.value?.jwtToken ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getEmailPreview(): DevEmailPreview | null {
    const stored = localStorage.getItem(this.emailPreviewKey);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as DevEmailPreview;
    } catch {
      localStorage.removeItem(this.emailPreviewKey);
      return null;
    }
  }

  clearEmailPreview(): void {
    localStorage.removeItem(this.emailPreviewKey);
  }

  getPendingVerificationEmail(): string | null {
    return localStorage.getItem(this.pendingVerificationEmailKey);
  }

  clearPendingVerificationEmail(): void {
    localStorage.removeItem(this.pendingVerificationEmailKey);
  }

  private setSession(user: User): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  private setPendingVerificationEmail(email: string): void {
    localStorage.setItem(
      this.pendingVerificationEmailKey,
      email
    );
  }

  private setEmailPreview(preview?: DevEmailPreview): void {
    if (!preview) {
      this.clearEmailPreview();
      return;
    }

    localStorage.setItem(this.emailPreviewKey, JSON.stringify(preview));
  }

  private getUserFromStorage(): User | null {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private toUser(response: AuthResponse): User {
    return {
      ...response,
      verified: response.verified ?? true
    };
  }
}
