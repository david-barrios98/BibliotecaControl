import { AppEnvironment } from '../app/core/config/environment.token';

/** Local development: use `npm start` so requests to `/api` are proxied (see `proxy.conf.json`). */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '',
  apiVersionPath: '/api/v1',
};
