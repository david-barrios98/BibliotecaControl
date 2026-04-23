import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import { unwrapApiResponse } from '@core/http/api-response-helpers';

export interface CountryLookupDto {
  id: number;
  code: string;
  name: string;
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
      this.http.get<ApiResponse<CountryLookupDto[]>>(`${base}/Country/List`).pipe(
        map((res) => (unwrapApiResponse(res) ?? []).filter(Boolean)),
      );

    return of(roots).pipe(
      switchMap(([first, second]) =>
        tryGet(first).pipe(
          catchError(() => (second ? tryGet(second) : of([]))),
          catchError(() => of([])),
        ),
      ),
    );
  }
}

