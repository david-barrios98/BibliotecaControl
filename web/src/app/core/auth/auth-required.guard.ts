import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';

function ensureLoggedIn(): boolean {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  if (session.getAccessToken()) return true;
  void router.navigate(['/login']);
  return false;
}

/** Bloquea rutas si no hay sesión iniciada. */
export const authRequiredGuard: CanActivateFn = () => ensureLoggedIn();

/** Bloquea hijos si no hay sesión iniciada. */
export const authRequiredChildGuard: CanActivateChildFn = () => ensureLoggedIn();

