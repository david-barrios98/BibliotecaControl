import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthSessionService } from '@core/auth/auth-session.service';

function isAnonymousPath(url: string): boolean {
  // Endpoints públicos según README.
  return (
    url.includes('/Auth/login') ||
    url.includes('/Auth/refresh') ||
    url.includes('/health/live') ||
    url.includes('/health/ready')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
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
      // Alcance "login": ante 401 limpiamos sesión y mandamos a /login.
      if (err?.status === 401) {
        session.clear();
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};

