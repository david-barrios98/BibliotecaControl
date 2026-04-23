import { InjectionToken } from '@angular/core';
import type { SweetAlertOptions } from 'sweetalert2';

/**
 * Opciones extra de SweetAlert2 fusionadas en cada diálogo (personalización por app).
 * Ejemplo en `app.config.ts`:
 * `{ provide: ALERT_DEFAULT_OPTIONS, useValue: { confirmButtonText: 'Entendido' } }`
 */
export const ALERT_DEFAULT_OPTIONS = new InjectionToken<Partial<SweetAlertOptions>>('ALERT_DEFAULT_OPTIONS');
