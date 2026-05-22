import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout')
        .then(m => m.AuthLayout),

    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login')
            .then(m => m.Login)
      },

      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register')
            .then(m => m.Register)
      },

      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password')
            .then(m => m.ForgotPassword)
      },

      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password')
            .then(m => m.ResetPassword)
      },

      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email')
            .then(m => m.VerifyEmail)
      }
    ]
  },

  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout')
        .then(m => m.MainLayout),

    children: [
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/profile/profile')
            .then(m => m.Profile)
      },

      {
         path: 'admin',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
            import('./features/admin/admin')
            .then(m => m.Admin)
      },

      {
        path: 'emails',
        loadComponent: () =>
          import('./features/auth/email-inbox/email-inbox')
            .then(m => m.EmailInbox)
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];