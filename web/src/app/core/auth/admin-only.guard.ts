import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';
import { AuthzService } from './authz.service';

export const adminOnlyGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const authz = inject(AuthzService);
  const router = inject(Router);

  if (!session.getAccessToken()) {
    void router.navigate(['/login']);
    return false;
  }
  if (!authz.isAdmin()) {
    void router.navigate(['/']);
    return false;
  }
  return true;
};

