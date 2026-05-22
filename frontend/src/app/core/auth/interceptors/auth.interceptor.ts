import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';

import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = this.authService.getAccessToken();
    const isAuthEndpoint = this.isAuthEndpoint(req);

    let authReq = req;

    if (token && !isAuthEndpoint) {
      authReq = this.addToken(req, token);
    }

    return next.handle(authReq).pipe(

      catchError((error: HttpErrorResponse) => {

        if (error.status === 401 && !isAuthEndpoint) {
          return this.handle401Error(authReq, next);
        }

        return throwError(() => error);
      })

    );
  }

  // =========================
  // ATTACH TOKEN
  // =========================
  private addToken(req: HttpRequest<any>, token: string) {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isAuthEndpoint(req: HttpRequest<any>): boolean {
    return [
      '/authenticate',
      '/register',
      '/resend-verification',
      '/verify-email',
      '/forgot-password',
      '/validate-reset-token',
      '/reset-password',
      '/refresh-token',
      '/revoke-token'
    ].some(path => req.url.includes(path));
  }

  // =========================
  // HANDLE 401
  // =========================
  private handle401Error(req: HttpRequest<any>, next: HttpHandler) {

    // If refresh already running → queue requests
    if (this.isRefreshing) {

      return this.refreshSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(req, token!));
        })
      );
    }

    this.isRefreshing = true;
    this.refreshSubject.next(null);

    return this.authService.refreshToken().pipe(

      switchMap((user) => {
        if (!user?.jwtToken) {
          this.authService.logout();
          return throwError(() => new Error('Unable to refresh session'));
        }

        this.isRefreshing = false;

        // broadcast new token
        this.refreshSubject.next(user.jwtToken);

        return next.handle(
          this.addToken(req, user.jwtToken)
        );
      }),

      catchError(err => {

        this.isRefreshing = false;

        // if refresh fails → logout user
        this.authService.logout();

        return throwError(() => err);
      })

    );
  }
}
