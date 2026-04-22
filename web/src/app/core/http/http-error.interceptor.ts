import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Central place for HTTP error mapping (toast, logging, ApiResponse errors).
 * Pass-through until feature work adds consistent UX.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => next(req);
