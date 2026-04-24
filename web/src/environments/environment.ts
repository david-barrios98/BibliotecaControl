import { AppEnvironment } from '../app/core/config/environment.token';

/**
 * Local development: use `npm start` so `/api` and `/uploads` are proxied to the API host
 * (see `proxy.conf.json`). Portadas (`coverUrl` absoluta al API) se reescriben a `/uploads/...` en el cliente.
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '',
  apiVersionPath: '/api/v1.0',
};
