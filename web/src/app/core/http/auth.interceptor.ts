import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { AuthApiService } from '@core/auth/auth-api.service';
import { AlertService } from '@core/notifications/alert.service';

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

let refreshInFlight: ReturnType<AuthApiService['refresh']> | null = null;
let lastSessionExpiredShownAt = 0;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);
  const alerts = inject(AlertService);

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
        const now = Date.now();
        if (now - lastSessionExpiredShownAt > 1500) {
          lastSessionExpiredShownAt = now;
          void alerts.info(
            'Tu sesión expiró o se inició sesión en otro lugar. Vuelve a iniciar sesión.',
            'Sesión finalizada',
          );
        }
        void router.navigate(['/login']);
        return throwError(() => err);
      }

      const refreshToken = session.getRefreshToken();
      if (!refreshToken) {
        session.clear();
        const now = Date.now();
        if (now - lastSessionExpiredShownAt > 1500) {
          lastSessionExpiredShownAt = now;
          void alerts.info(
            'Tu sesión expiró. Vuelve a iniciar sesión.',
            'Sesión finalizada',
          );
        }
        void router.navigate(['/login']);
        return throwError(() => err);
      }

      // 401 concurrentes: hacer 1 refresh compartido (evita carreras y estados colgados).
      if (!refreshInFlight) {
        refreshInFlight = authApi
          .refresh({ refreshToken })
          .pipe(
            shareReplay({ bufferSize: 1, refCount: false }),
            finalize(() => {
              refreshInFlight = null;
            }),
          );
      }

      return refreshInFlight.pipe(
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
          const now = Date.now();
          if (now - lastSessionExpiredShownAt > 1500) {
            lastSessionExpiredShownAt = now;
            void alerts.info(
              'Tu sesión expiró o se inició sesión en otro lugar. Vuelve a iniciar sesión.',
              'Sesión finalizada',
            );
          }
          void router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

