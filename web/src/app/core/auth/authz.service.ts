import { Injectable, computed, inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';
import { getJwtRoles, parseJwtClaims } from './jwt-claims';

@Injectable({ providedIn: 'root' })
export class AuthzService {
  private readonly session = inject(AuthSessionService);

  readonly claims = computed(() => parseJwtClaims(this.session.accessToken()));
  readonly roles = computed(() => getJwtRoles(this.claims()));
  readonly isAdmin = computed(() => this.roles().some((r) => r.toLowerCase() === 'admin'));
}

