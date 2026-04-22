import { AppEnvironment } from '../app/core/config/environment.token';

/**
 * Production build. Set `apiBaseUrl` to your deployed API origin if the SPA is hosted on another domain.
 * Same-origin deployments can keep an empty string and serve the API behind the same host.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '',
  apiVersionPath: '/api/v1.0',
};
