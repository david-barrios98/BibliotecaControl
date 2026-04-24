import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import type { PagedResult } from '@core/models/paged-result';
import { parseHttpError, unwrapApiResponse } from '@core/http/api-response-helpers';
import type { CreateUserRequestDto, UpdateUserRequestDto, UserListQuery, UserResponseDto } from '../models/user.dto';
import { normalizePagedUserResult, normalizeUserResponseDto } from '../utils/user-dto-normalize';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get userBase(): string {
    return `${apiRootUrl(this.env)}/User`;
  }

  list(q: UserListQuery): Observable<PagedResult<UserResponseDto>> {
    let params = new HttpParams().set('pageNumber', String(q.pageNumber)).set('pageSize', String(q.pageSize));
    const s = (q.search ?? '').trim();
    if (s) params = params.set('search', s);

    return this.http.get<ApiResponse<PagedResult<UserResponseDto>>>(`${this.userBase}/List`, { params }).pipe(
      map((res) => normalizePagedUserResult(unwrapApiResponse(res))),
      catchError((err: unknown) => this.catchEmptyList(err, q)),
    );
  }

  /** Usuarios para reportes/lookups (todas las páginas). */
  listAllForLookup(pageSize = 50, search?: string | null): Observable<UserResponseDto[]> {
    return this.list({ pageNumber: 1, pageSize, search: search ?? null }).pipe(
      switchMap((first) => {
        const items = [...(first.items ?? [])];
        const totalPages = first.totalPages ?? 1;
        if (totalPages <= 1) return of(items);
        const rest = Array.from({ length: totalPages - 1 }, (_, i) =>
          this.list({ pageNumber: i + 2, pageSize, search: search ?? null }),
        );
        return forkJoin(rest).pipe(
          map((pages) => {
            for (const pg of pages) items.push(...(pg.items ?? []));
            return items;
          }),
        );
      }),
    );
  }

  getById(id: number): Observable<UserResponseDto> {
    return this.http.get<ApiResponse<UserResponseDto>>(`${this.userBase}/${id}`).pipe(
      map((res) => normalizeUserResponseDto(unwrapApiResponse(res))),
    );
  }

  create(body: CreateUserRequestDto): Observable<UserResponseDto> {
    return this.http.post<ApiResponse<UserResponseDto>>(this.userBase, body).pipe(
      map((res) => normalizeUserResponseDto(unwrapApiResponse(res))),
    );
  }

  update(id: number, body: UpdateUserRequestDto): Observable<void> {
    return this.http.put<ApiResponse<string>>(`${this.userBase}/${id}`, body).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  /** DELETE `/User/{id}` — desactiva (soft delete). */
  deactivate(id: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.userBase}/${id}`).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  private catchEmptyList(err: unknown, q: UserListQuery): Observable<PagedResult<UserResponseDto>> {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      return of({
        items: [],
        pageNumber: q.pageNumber,
        pageSize: q.pageSize,
        totalRecords: 0,
        totalPages: 0,
      });
    }
    return throwError(() => new Error(parseHttpError(err)));
  }
}

