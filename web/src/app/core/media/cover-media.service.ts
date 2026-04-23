import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs';
import { ENVIRONMENT, resolveUploadsPublicUrl } from '@core/config/environment.token';

/**
 * Portadas bajo `/uploads/...`: el `<img src>` directo no envía JWT; si el API exige auth,
 * hay que cargar el binario vía HttpClient y usar un blob URL.
 */
@Injectable({ providedIn: 'root' })
export class CoverMediaService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  /**
   * URL lista para `[src]`: blob interno si hace falta auth en mismo origen, o la URL pública si no.
   */
  coverDisplayUrl(apiCoverUrl: string | null | undefined): Observable<string | null> {
    const resolved = resolveUploadsPublicUrl(apiCoverUrl ?? null, this.env);
    if (!resolved) return of(null);
    if (this.shouldFetchWithHttp(resolved)) {
      return this.http.get(resolved, { responseType: 'blob' }).pipe(
        map((blob) => URL.createObjectURL(blob)),
        catchError(() => of(null)),
      );
    }
    return of(resolved);
  }

  /** Rutas relativas `/uploads` (proxy en dev o mismo host en prod). */
  private shouldFetchWithHttp(resolved: string): boolean {
    return resolved.startsWith('/uploads');
  }
}
