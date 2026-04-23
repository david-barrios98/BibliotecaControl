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
 * URLs públicas de ficheros bajo `/uploads/...` que devuelve el API (p. ej. `coverUrl` absoluta al host Kestrel).
 *
 * Con `ng serve`, las peticiones van al origen del dev server (p. ej. `:4200`). Si `coverUrl` es
 * `https://localhost:7198/uploads/...`, el navegador habla directo con el API y puede fallar el TLS
 * de desarrollo. Cuando `apiBaseUrl` está vacío (modo proxy), reescribe a ruta relativa
 * `/uploads/...` para que coincida con `proxy.conf.json` → mismo host que el SPA.
 */
export function resolveUploadsPublicUrl(url: string | null | undefined, env: AppEnvironment): string | null {
  if (url == null) return null;
  const s = String(url).trim();
  if (s === '') return null;
  if (env.production) return s;
  const base = env.apiBaseUrl.replace(/\/+$/, '');
  if (base !== '') return s;
  try {
    const u = new URL(s);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && u.pathname.startsWith('/uploads')) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* relativa u otro esquema */
  }
  return s;
}
