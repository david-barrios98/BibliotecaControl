import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  readonly production: boolean;
  /** API origin without trailing slash; empty string = same origin as the SPA (recommended with dev proxy or reverse proxy). */
  readonly apiBaseUrl: string;
  /** Version segment including leading slash, aligned with backend versioning (e.g. `/api/v1.0`). */
  readonly apiVersionPath: string;
}

export const ENVIRONMENT = new InjectionToken<AppEnvironment>('app.environment');

/** Full base URL for REST calls (no trailing slash). */
export function apiRootUrl(env: AppEnvironment): string {
  const base = env.apiBaseUrl.replace(/\/+$/, '');
  const ver = env.apiVersionPath.startsWith('/') ? env.apiVersionPath : `/${env.apiVersionPath}`;
  return `${base}${ver}`;
}
