import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import { unwrapApiResponse } from '@core/http/api-response-helpers';

type CountryListPayload =
  | string[]
  | { name?: string | null; code?: string | null }[];

function normalizeCountryList(payload: CountryListPayload | unknown): string[] {
  if (Array.isArray(payload)) {
    return payload
      .map((x) => {
        if (typeof x === 'string') return x;
        if (x && typeof x === 'object') {
          const name = (x as { name?: unknown }).name;
          const code = (x as { code?: unknown }).code;
          if (typeof name === 'string' && name.trim()) return name.trim();
          if (typeof code === 'string' && code.trim()) return code.trim();
        }
        return '';
      })
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class CountryApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private roots(): string[] {
    const root = apiRootUrl(this.env);
    // Compat: algunos endpoints pueden estar expuestos como /api/v1 (sin .0).
    const rootV1 = root.replace(/\/api\/v1\.0\b/, '/api/v1');
    return rootV1 === root ? [root] : [root, rootV1];
  }

  list() {
    const roots = this.roots();
    const tryGet = (base: string) =>
      this.http.get<ApiResponse<CountryListPayload>>(`${base}/Country/List`).pipe(
        map((res) => normalizeCountryList(unwrapApiResponse(res))),
      );

    return of(roots).pipe(
      switchMap(([first, second]) =>
        tryGet(first).pipe(
          catchError((err) => (second ? tryGet(second) : of([]))),
          catchError(() => of([])),
        ),
      ),
    );
  }
}

