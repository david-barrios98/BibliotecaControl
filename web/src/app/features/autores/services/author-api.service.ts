import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import type { PagedResult } from '@core/models/paged-result';
import { parseHttpError, unwrapApiResponse } from '@core/http/api-response-helpers';
import type { AuthorRequestDto, AuthorResponseDto } from '../models/author.dto';

@Injectable({ providedIn: 'root' })
export class AuthorApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get authorBase(): string {
    return `${apiRootUrl(this.env)}/Author`;
  }

  /** Parámetros de consulta tal como documenta Swagger (`PageNumber`, `PageSize`). */
  list(pageNumber: number, pageSize: number): Observable<PagedResult<AuthorResponseDto>> {
    const params = new HttpParams()
      .set('PageNumber', String(pageNumber))
      .set('PageSize', String(pageSize));

    return this.http.get<ApiResponse<PagedResult<AuthorResponseDto>>>(`${this.authorBase}/List`, { params }).pipe(
      map((res) => unwrapApiResponse(res)),
      catchError((err: unknown) => this.catchEmptyAuthorList(err, pageNumber, pageSize)),
    );
  }

  getById(id: number): Observable<AuthorResponseDto> {
    return this.http.get<ApiResponse<AuthorResponseDto>>(`${this.authorBase}/${id}`).pipe(map((res) => unwrapApiResponse(res)));
  }

  create(body: AuthorRequestDto): Observable<AuthorResponseDto> {
    return this.http.post<ApiResponse<AuthorResponseDto>>(this.authorBase, body).pipe(map((res) => unwrapApiResponse(res)));
  }

  update(id: number, body: AuthorRequestDto): Observable<void> {
    return this.http.put<ApiResponse<string>>(`${this.authorBase}/${id}`, body).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.authorBase}/${id}`).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  /**
   * La API puede devolver 404 cuando no hay registros en el listado.
   * Se normaliza a página vacía; el resto de errores se propagan.
   */
  private catchEmptyAuthorList(
    err: unknown,
    pageNumber: number,
    pageSize: number,
  ): Observable<PagedResult<AuthorResponseDto>> {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      return of({
        items: [],
        pageNumber,
        pageSize,
        totalRecords: 0,
        totalPages: 0,
      });
    }
    return throwError(() => new Error(parseHttpError(err)));
  }
}
