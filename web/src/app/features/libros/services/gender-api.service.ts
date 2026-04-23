import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import { unwrapApiResponse } from '@core/http/api-response-helpers';

/** Lookup de género para combos (alta/edición de libro). */
export interface GenderLookupDto {
  id?: number;
  name: string;
  code?: string | null;
}

@Injectable({ providedIn: 'root' })
export class GenderApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private roots(): string[] {
    const root = apiRootUrl(this.env);
    const rootV1 = root.replace(/\/api\/v1\.0\b/, '/api/v1');
    return rootV1 === root ? [root] : [root, rootV1];
  }

  /** GET `/Gender/List` — lista para el campo `Gender` del multipart. */
  list() {
    const roots = this.roots();
    const normalize = (raw: unknown): GenderLookupDto[] => {
      const arr = Array.isArray(raw) ? raw : [];
      const out: GenderLookupDto[] = [];
      for (const x of arr) {
        if (typeof x === 'string') {
          const name = x.trim();
          if (name) out.push({ name });
          continue;
        }
        if (x && typeof x === 'object') {
          const o = x as Record<string, unknown>;
          const nameRaw = o['name'];
          const codeRaw = o['code'];
          const idRaw = o['id'];
          if (typeof nameRaw === 'string' && nameRaw.trim()) {
            let id: number | undefined;
            if (typeof idRaw === 'number' && Number.isFinite(idRaw)) id = idRaw;
            else if (typeof idRaw === 'string') {
              const n = +idRaw;
              if (Number.isFinite(n)) id = n;
            }
            out.push({
              id,
              name: nameRaw.trim(),
              code: typeof codeRaw === 'string' ? codeRaw : null,
            });
            continue;
          }
          if (typeof codeRaw === 'string' && codeRaw.trim()) {
            const name = codeRaw.trim();
            out.push({ name, code: name });
          }
        }
      }
      const seen = new Set<string>();
      return out.filter((g) => {
        if (seen.has(g.name)) return false;
        seen.add(g.name);
        return true;
      });
    };

    const tryGet = (base: string) =>
      this.http.get<ApiResponse<unknown>>(`${base}/Gender/List`).pipe(map((res) => normalize(unwrapApiResponse(res))));

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
