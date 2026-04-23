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

/**
 * URLs públicas bajo `/uploads/...`:
 * - El API puede devolver absolutas (`https://host/uploads/...`), relativas con slash (`/uploads/...`)
 *   o sin slash (`uploads/books/...`). Sin `/` inicial el navegador resuelve mal respecto a la ruta actual.
 * - Con `ng serve` y `apiBaseUrl` vacío, las absolutas al host del API se reescriben a `/uploads/...`
 *   para el proxy (`proxy.conf.json`).
 */
export function resolveUploadsPublicUrl(url: string | null | undefined, env: AppEnvironment): string | null {
  if (url == null) return null;
  const s = String(url).trim();
  if (s === '') return null;

  const isHttpAbsolute = /^https?:\/\//i.test(s);

  if (!isHttpAbsolute) {
    if (s.startsWith('uploads/') || s.startsWith('/uploads/') || s === 'uploads' || s === '/uploads') {
      return s.startsWith('/') ? s : `/${s}`;
    }
    return s;
  }

  const base = env.apiBaseUrl.replace(/\/+$/, '');
  if (!env.production && base === '') {
    try {
      const u = new URL(s);
      if ((u.protocol === 'http:' || u.protocol === 'https:') && u.pathname.startsWith('/uploads')) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* seguir */
    }
  }
  return s;
}
