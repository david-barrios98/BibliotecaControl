import { HttpErrorResponse } from '@angular/common/http';
import type { ApiResponse } from '@core/models/api-response';

export class ApiBusinessError extends Error {
  override readonly name = 'ApiBusinessError';

  constructor(
    message: string,
    public readonly errors: string[] = [],
  ) {
    super(message);
  }
}

export function unwrapApiResponse<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    const errs = res.errors ?? [];
    const msg = errs.length ? errs.join('; ') : 'La operación no tuvo éxito.';
    throw new ApiBusinessError(msg, errs);
  }
  return res.data;
}

/** Extrae mensaje para UI desde errores HTTP o ApiResponse en el cuerpo. */
export function parseHttpError(err: unknown): string {
  if (err instanceof ApiBusinessError) {
    return err.message;
  }
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const api = body as Partial<ApiResponse<unknown>>;
      if (Array.isArray(api.errors) && api.errors.length > 0) {
        return api.errors.filter(Boolean).join('; ');
      }
    }
    if (err.status === 0) {
      return 'No se pudo conectar con la API. Compruebe que el backend está en ejecución y el proxy activo.';
    }
    return err.message || `${err.status} ${err.statusText}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
