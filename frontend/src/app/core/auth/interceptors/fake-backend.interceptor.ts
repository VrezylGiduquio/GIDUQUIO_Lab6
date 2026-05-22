import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

import { environment } from '@environments/environment';

type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'Admin' | 'User';
  verified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
};

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  private readonly usersKey = 'fakeBackendUsers';
  private readonly refreshTokenKey = 'fakeBackendRefreshToken';

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, body, headers } = req;
    const accountsUrl = `${environment.apiUrl}/accounts`;

    return of(null).pipe(
      mergeMap(() => {
        if (!url.startsWith(accountsUrl)) {
          return next.handle(req);
        }

        const rawPath = url.replace(accountsUrl, '');
        const path = rawPath || '/';

        switch (`${method} ${path}`) {
          case 'POST /register':
            return this.register(body);
          case 'POST /resend-verification':
            return this.resendVerification(body);
          case 'POST /authenticate':
            return this.authenticate(body);
          case 'POST /verify-email':
            return this.verifyEmail(body);
          case 'POST /forgot-password':
            return this.forgotPassword(body);
          case 'POST /validate-reset-token':
            return this.validateResetToken(body);
          case 'POST /reset-password':
            return this.resetPassword(body);
          case 'POST /refresh-token':
            return this.refreshToken();
          case 'POST /revoke-token':
            return this.revokeToken();
          case 'GET /':
            return this.getAccounts(headers.get('Authorization'));
        }

        if (method === 'GET' && /^\/[^/]+$/.test(path)) {
          return this.getAccount(path.slice(1), headers.get('Authorization'));
        }

        if (method === 'PUT' && /^\/[^/]+$/.test(path)) {
          return this.updateAccount(path.slice(1), body, headers.get('Authorization'));
        }

        if (method === 'POST' && /^\/[^/]+\/change-password$/.test(path)) {
          const accountId = path.split('/')[1];
          return this.changePassword(accountId, body, headers.get('Authorization'));
        }

        if (method === 'DELETE' && /^\/[^/]+$/.test(path)) {
          return this.deleteAccount(path.slice(1), headers.get('Authorization'));
        }

        return next.handle(req);
      }),
      materialize(),
      delay(75),
      dematerialize()
    );
  }

  private register(body: any) {
    const users = this.getUsers();
    const email = String(body.email ?? '').toLowerCase();

    if (users.some(user => user.email === email)) {
      return this.error(400, 'Email is already registered');
    }

    const verificationToken = crypto.randomUUID();
    const user: StoredUser = {
      id: crypto.randomUUID(),
      firstName: body.firstName,
      lastName: body.lastName,
      email,
      password: body.password,
      role: users.length === 0 ? 'Admin' : 'User',
      verified: false,
      verificationToken
    };

    users.push(user);
    this.saveUsers(users);

    return this.ok({
      message: 'Registration successful. Check your email for the verification link.',
      devEmailPreview: this.buildDevEmailPreview(
        user.email,
        'Verify your account',
        `${window.location.origin}/verify-email?token=${verificationToken}`
      )
    }, 201);
  }

  private resendVerification(body: any) {
    const users = this.getUsers();
    const email = String(body.email ?? '').toLowerCase();
    const user = users.find(item => item.email === email);

    if (!user) {
      return this.ok({ message: 'If the account exists, a verification link has been sent.' });
    }

    if (user.verified) {
      return this.ok({ message: 'Account is already verified. You can sign in.' });
    }

    user.verificationToken = crypto.randomUUID();
    this.saveUsers(users);

    return this.ok({
      message: 'Verification email resent successfully.',
      devEmailPreview: this.buildDevEmailPreview(
        user.email,
        'Verify your account',
        `${window.location.origin}/verify-email?token=${user.verificationToken}`
      )
    });
  }

  private authenticate(body: any) {
    const users = this.getUsers();
    const email = String(body.email ?? '').toLowerCase();
    const user = users.find(item => item.email === email && item.password === body.password);

    if (!user) {
      return this.error(400, 'Invalid email or password');
    }

    if (!user.verified) {
      return this.error(400, 'Account not verified');
    }

    localStorage.setItem(this.refreshTokenKey, crypto.randomUUID());
    return this.ok(this.toAuthResponse(user));
  }

  private verifyEmail(body: any) {
    const users = this.getUsers();
    const token = String(body.token ?? '');
    const user = users.find(item => item.verificationToken === token);

    if (!user) {
      return this.error(400, 'Invalid verification token');
    }

    user.verified = true;
    delete user.verificationToken;
    this.saveUsers(users);

    return this.ok({ message: 'Verification successful' });
  }

  private forgotPassword(body: any) {
    const users = this.getUsers();
    const email = String(body.email ?? '').toLowerCase();
    const user = users.find(item => item.email === email);

    if (!user) {
      return this.ok({ message: 'If the account exists, a reset link has been sent.' });
    }

    user.resetToken = crypto.randomUUID();
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    this.saveUsers(users);

    return this.ok({
      message: 'If the account exists, a reset link has been sent.',
      devEmailPreview: this.buildDevEmailPreview(
        user.email,
        'Reset your password',
        `${window.location.origin}/reset-password?token=${user.resetToken}`
      )
    });
  }

  private validateResetToken(body: any) {
    const user = this.getUsers().find(item =>
      item.resetToken === body.token &&
      typeof item.resetTokenExpiry === 'number' &&
      item.resetTokenExpiry > Date.now()
    );

    if (!user) {
      return this.error(400, 'Invalid or expired reset token');
    }

    return this.ok({ message: 'Token is valid' });
  }

  private resetPassword(body: any) {
    const users = this.getUsers();
    const user = users.find(item =>
      item.resetToken === body.token &&
      typeof item.resetTokenExpiry === 'number' &&
      item.resetTokenExpiry > Date.now()
    );

    if (!user) {
      return this.error(400, 'Invalid or expired reset token');
    }

    if (body.password !== body.confirmPassword) {
      return this.error(400, 'Passwords do not match');
    }

    user.password = body.password;
    delete user.resetToken;
    delete user.resetTokenExpiry;
    this.saveUsers(users);

    return this.ok({ message: 'Password reset successful' });
  }

  private refreshToken() {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    const currentUser = this.getCurrentSessionUser();

    if (!refreshToken || !currentUser) {
      return this.error(401, 'Refresh token is required');
    }

    return this.ok(this.toAuthResponse(currentUser));
  }

  private revokeToken() {
    localStorage.removeItem(this.refreshTokenKey);
    return this.ok({ message: 'Token revoked' });
  }

  private getAccounts(authorization: string | null) {
    let actor: StoredUser;

    try {
      actor = this.requireAuthorizedUser(authorization);
    } catch {
      return this.error(401, 'Unauthorized');
    }

    if (actor.role !== 'Admin') {
      return this.error(403, 'Forbidden');
    }

    return this.ok(this.getUsers().map(user => this.toPublicUser(user)));
  }

  private getAccount(id: string, authorization: string | null) {
    let actor: StoredUser;

    try {
      actor = this.requireAuthorizedUser(authorization);
    } catch {
      return this.error(401, 'Unauthorized');
    }

    const user = this.getUsers().find(item => item.id === id);

    if (!user) {
      return this.error(404, 'Account not found');
    }

    if (actor.role !== 'Admin' && actor.id !== id) {
      return this.error(403, 'Forbidden');
    }

    return this.ok(this.toPublicUser(user));
  }

  private updateAccount(id: string, body: any, authorization: string | null) {
    let actor: StoredUser;

    try {
      actor = this.requireAuthorizedUser(authorization);
    } catch {
      return this.error(401, 'Unauthorized');
    }

    const users = this.getUsers();
    const user = users.find(item => item.id === id);

    if (!user) {
      return this.error(404, 'Account not found');
    }

    if (actor.role !== 'Admin' && actor.id !== id) {
      return this.error(403, 'Forbidden');
    }

    const nextEmail = String(body.email ?? '').toLowerCase();
    const duplicate = users.find(item => item.email === nextEmail && item.id !== id);

    if (duplicate) {
      return this.error(400, 'Email is already registered');
    }

    user.firstName = body.firstName;
    user.lastName = body.lastName;
    user.email = nextEmail;

    if (actor.role === 'Admin' && (body.role === 'Admin' || body.role === 'User')) {
      user.role = body.role;
    }

    this.saveUsers(users);
    return this.ok(this.toAuthResponse(user));
  }

  private changePassword(id: string, body: any, authorization: string | null) {
    let actor: StoredUser;

    try {
      actor = this.requireAuthorizedUser(authorization);
    } catch {
      return this.error(401, 'Unauthorized');
    }

    const users = this.getUsers();
    const user = users.find(item => item.id === id);

    if (!user) {
      return this.error(404, 'Account not found');
    }

    if (actor.id !== id) {
      return this.error(403, 'Forbidden');
    }

    if (user.password !== body.currentPassword) {
      return this.error(400, 'Current password is incorrect');
    }

    if (body.newPassword !== body.confirmPassword) {
      return this.error(400, 'Passwords do not match');
    }

    user.password = body.newPassword;
    this.saveUsers(users);

    return this.ok({ message: 'Password updated successfully' });
  }

  private deleteAccount(id: string, authorization: string | null) {
    let actor: StoredUser;

    try {
      actor = this.requireAuthorizedUser(authorization);
    } catch {
      return this.error(401, 'Unauthorized');
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(item => item.id === id);

    if (userIndex === -1) {
      return this.error(404, 'Account not found');
    }

    if (actor.role !== 'Admin' && actor.id !== id) {
      return this.error(403, 'Forbidden');
    }

    users.splice(userIndex, 1);
    this.saveUsers(users);

    if (actor.id === id) {
      localStorage.removeItem(this.refreshTokenKey);
    }

    return this.ok({ message: 'Account deleted' });
  }

  private requireAuthorizedUser(authorization: string | null) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } });
    }

    const token = authorization.slice(7);
    const payload = this.parseTokenPayload(token);
    const user = this.getUsers().find(item => item.id === payload.sub);

    if (!user) {
      throw new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } });
    }

    return user;
  }

  private parseTokenPayload(token: string) {
    if (!token.includes('.')) {
      return JSON.parse(atob(token));
    }

    const payloadSegment = token.split('.')[1];

    if (!payloadSegment) {
      throw new Error('Invalid token');
    }

    const normalized = payloadSegment
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=');

    return JSON.parse(atob(normalized));
  }

  private getCurrentSessionUser() {
    const stored = localStorage.getItem('currentUser');

    if (!stored) {
      return null;
    }

    try {
      const user = JSON.parse(stored);
      return this.getUsers().find(item => item.id === user.id) ?? null;
    } catch {
      return null;
    }
  }

  private getUsers(): StoredUser[] {
    try {
      return JSON.parse(localStorage.getItem(this.usersKey) || '[]') as StoredUser[];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private toPublicUser(user: StoredUser) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      verified: user.verified
    };
  }

  private toAuthResponse(user: StoredUser) {
    return {
      ...this.toPublicUser(user),
      jwtToken: btoa(JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 15 * 60 * 1000
      }))
    };
  }

  private buildDevEmailPreview(to: string, subject: string, actionUrl: string) {
    return {
      to,
      subject,
      body: `Open this link to continue: ${actionUrl}`,
      actionUrl
    };
  }

  private ok(body?: unknown, status = 200) {
    return of(new HttpResponse({ status, body }));
  }

  private error(status: number, message: string) {
    return throwError(() =>
      new HttpErrorResponse({
        status,
        error: { message }
      })
    );
  }
}
