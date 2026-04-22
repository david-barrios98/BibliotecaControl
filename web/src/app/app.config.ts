import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { ENVIRONMENT } from './core/config/environment.token';
import { environment } from '../environments/environment';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    { provide: ENVIRONMENT, useValue: environment },
  ],
};
