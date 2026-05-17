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

    const token = localStorage.getItem('accessToken');

    let authReq = req;

    if (token) {
      authReq = this.addToken(req, token);
    }

    return next.handle(authReq).pipe(

      catchError((error: HttpErrorResponse) => {

        // Only handle auth errors
        if (error.status === 401) {
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

      switchMap((response) => {

        this.isRefreshing = false;

        // broadcast new token
        this.refreshSubject.next(response.accessToken);

        return next.handle(
          this.addToken(req, response.accessToken)
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