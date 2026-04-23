import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { AuthApiService } from '@core/auth/auth-api.service';

function isAnonymousPath(url: string): boolean {
  // Endpoints públicos según README.
  return (
    url.includes('/Auth/login') ||
    url.includes('/Auth/refresh') ||
    url.includes('/health/live') ||
    url.includes('/health/ready')
  );
}

const RETRIED_HEADER = 'x-bc-auth-retried';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);

  const token = session.getAccessToken();
  const shouldAttach = !!token && !isAnonymousPath(req.url);

  const request = shouldAttach
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(request).pipe(
    catchError((err) => {
      if (err?.status !== 401) return throwError(() => err);

      // Nunca refrescar si ya estamos en refresh/login/logout/health.
      if (isAnonymousPath(req.url) || req.url.includes('/Auth/logout')) {
        session.clear();
        void router.navigate(['/login']);
        return throwError(() => err);
      }

      // Evitar bucle: solo reintenta 1 vez.
      if (req.headers.has(RETRIED_HEADER)) {
        session.clear();
        void router.navigate(['/login']);
        return throwError(() => err);
      }

      const refreshToken = session.getRefreshToken();
      if (!refreshToken) {
        session.clear();
        void router.navigate(['/login']);
        return throwError(() => err);
      }

      return authApi.refresh({ refreshToken }).pipe(
        switchMap(() => {
          const newAccess = session.getAccessToken();
          const retried = req.clone({
            setHeaders: {
              ...(newAccess ? { Authorization: `Bearer ${newAccess}` } : {}),
              [RETRIED_HEADER]: '1',
            },
          });
          return next(retried);
        }),
        catchError((refreshErr) => {
          session.clear();
          void router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

