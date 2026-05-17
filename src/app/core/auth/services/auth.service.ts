import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

import { User } from '../models/user.model';
import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { FakeEmail } from '../models/fake-email.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // =========================
  // STATE
  // =========================
  private userSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );
  user$ = this.userSubject.asObservable();

  private emailSubject = new BehaviorSubject<FakeEmail[]>([]);
  emails$ = this.emailSubject.asObservable();

  private refreshTimer: any;

  // =========================
  // EMAIL SYSTEM
  // =========================
  private sendEmail(email: FakeEmail): void {
    const emails = this.emailSubject.value;
    this.emailSubject.next([email, ...emails]);
  }

  // =========================
  // STORAGE
  // =========================
  private loadUsers(): any[] {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }

  private saveUsers(users: any[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  private saveCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  // =========================
  // JWT HELPERS
  // =========================
  private generateFakeJwt(user: User): string {
    return btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 900000
    }));
  }

  private storeTokens(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem(
      'tokenExpiry',
      (Date.now() + response.expiresIn * 1000).toString()
    );
  }

  // =========================
  // LOGIN
  // =========================
  login(data: LoginRequest): Observable<AuthResponse> {

    const users = this.loadUsers();

    const user = users.find(
      u => u.email === data.email && u.password === data.password
    );

    if (!user) {
      return throwError(() => 'Invalid email or password');
    }

    if (!user.verified) {
      return throwError(() => 'Account not verified');
    }

    this.logout(); // reset any previous session

    this.userSubject.next(user);
    this.saveCurrentUser(user);

    const response: AuthResponse = {
      user,
      accessToken: this.generateFakeJwt(user),
      refreshToken: crypto.randomUUID(),
      expiresIn: 900
    };

    this.storeTokens(response);
    this.startTokenTimer();

    return of(response);
  }

  // =========================
  // REGISTER
  // =========================
  register(data: RegisterRequest): Observable<AuthResponse> {

    const users = this.loadUsers();

    const exists = users.some(u => u.email === data.email);

    if (exists) {
      return throwError(() => 'User already exists');
    }

    const token = crypto.randomUUID();

    const newUser: any = {
      id: crypto.randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: users.length === 0 ? 'Admin' : 'User',
      verified: false,
      verificationToken: token
    };

    users.push(newUser);
    this.saveUsers(users);

    this.sendEmail({
      to: newUser.email,
      subject: 'Verify your account',
      body: `/verify-email?token=${token}`,
      createdAt: Date.now()
    });

    const response: AuthResponse = {
      user: newUser,
      accessToken: this.generateFakeJwt(newUser),
      refreshToken: crypto.randomUUID(),
      expiresIn: 900
    };

    this.storeTokens(response);

    return of(response);
  }

  // =========================
  // VERIFY EMAIL
  // =========================
  verifyEmail(token: string): boolean {

    const users = this.loadUsers();

    const user = users.find(u => u.verificationToken === token);

    if (!user) return false;

    user.verified = true;
    user.verificationToken = undefined;

    this.saveUsers(users);

    return true;
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  forgotPassword(email: string): void {

    const users = this.loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) return;

    const token = crypto.randomUUID();

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    this.saveUsers(users);

    this.sendEmail({
      to: user.email,
      subject: 'Reset your password',
      body: `/reset-password?token=${token}`,
      createdAt: Date.now()
    });
  }

  // =========================
  // RESET PASSWORD
  // =========================
  resetPassword(token: string, newPassword: string): boolean {

    const users = this.loadUsers();

    const user = users.find(u =>
      u.resetToken === token &&
      u.resetTokenExpiry &&
      u.resetTokenExpiry > Date.now()
    );

    if (!user) return false;

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    this.saveUsers(users);

    this.sendEmail({
      to: user.email,
      subject: 'Password changed',
      body: 'Your password was successfully updated.',
      createdAt: Date.now()
    });

    return true;
  }

  // =========================
  // TOKEN TIMER
  // =========================
  startTokenTimer(): void {

    clearTimeout(this.refreshTimer);

    const expiry = Number(localStorage.getItem('tokenExpiry'));

    if (!expiry) return;

    const timeLeft = expiry - Date.now();

    const refreshTime = timeLeft - 60000;

    if (refreshTime <= 0) {
      this.refreshToken().subscribe();
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe();
      this.startTokenTimer();
    }, refreshTime);
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  refreshToken(): Observable<AuthResponse> {

    const user = this.getCurrentUser();
    const refreshToken = localStorage.getItem('refreshToken');

    if (!user || !refreshToken) {
      this.logout();
      return throwError(() => 'No session');
    }

    const response: AuthResponse = {
      user,
      accessToken: this.generateFakeJwt(user),
      refreshToken,
      expiresIn: 900
    };

    this.storeTokens(response);

    return of(response);
  }

  // =========================
  // LOGOUT
  // =========================
  logout(): void {

    clearTimeout(this.refreshTimer);

    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');

    this.userSubject.next(null);
  }

  // =========================
  // USER HELPERS
  // =========================
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isTokenValid(): boolean {
    const expiry = Number(localStorage.getItem('tokenExpiry'));
    return expiry > Date.now();
  }

  updateUser(user: User): void {

    const users = this.loadUsers();

    const index = users.findIndex(u => u.id === user.id);

    if (index !== -1) {
      users[index] = user;
      this.saveUsers(users);
    }

    this.saveCurrentUser(user);
    this.userSubject.next(user);
  }
}