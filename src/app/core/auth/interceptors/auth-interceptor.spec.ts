import { TestBed } from '@angular/core/testing';

import { AuthService } from '../services/auth.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => null,
            refreshToken: () => null,
            logout: () => undefined
          }
        }
      ]
    });

    interceptor = TestBed.inject(AuthInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
