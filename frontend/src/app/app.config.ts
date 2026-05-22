import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { environment } from '@environments/environment';
import { AuthInterceptor } from './core/auth/interceptors/auth.interceptor';
import { FakeBackendInterceptor } from './core/auth/interceptors/fake-backend.interceptor';
import { AuthService } from './core/auth/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    ...(environment.useFakeBackend ? [{
      provide: HTTP_INTERCEPTORS,
      useClass: FakeBackendInterceptor,
      multi: true
    }] : []),

    provideAppInitializer(() => {
      const authService = inject(AuthService);

      if (!authService.hasStoredSession()) {
        return Promise.resolve();
      }

      return firstValueFrom(authService.refreshToken());
    })
  ]
};
