import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import type { PagedResult } from '@core/models/paged-result';
import { parseHttpError, unwrapApiResponse } from '@core/http/api-response-helpers';
import type { CreatePersonRequestDto, PersonResponseDto, UpdatePersonRequestDto } from '../models/person.dto';
import { normalizePagedPersonResult, normalizePersonResponseDto } from '../utils/person-dto-normalize';

@Injectable({ providedIn: 'root' })
export class PersonApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get personBase(): string {
    return `${apiRootUrl(this.env)}/Person`;
  }

  /** Query opcional `searchTerm`: nombre, apellido, email, teléfono, dirección. */
  list(pageNumber: number, pageSize: number, searchTerm?: string): Observable<PagedResult<PersonResponseDto>> {
    let params = new HttpParams().set('pageNumber', String(pageNumber)).set('pageSize', String(pageSize));
    const q = (searchTerm ?? '').trim();
    if (q) params = params.set('searchTerm', q);

    return this.http.get<ApiResponse<PagedResult<PersonResponseDto>>>(`${this.personBase}/List`, { params }).pipe(
      map((res) => normalizePagedPersonResult(unwrapApiResponse(res))),
      catchError((err: unknown) => this.catchEmptyList(err, pageNumber, pageSize)),
    );
  }

  getById(id: number): Observable<PersonResponseDto> {
    return this.http.get<ApiResponse<PersonResponseDto>>(`${this.personBase}/${id}`).pipe(
      map((res) => normalizePersonResponseDto(unwrapApiResponse(res))),
    );
  }

  /** POST `/Person` — body `CreatePersonRequestDto`. */
  create(body: CreatePersonRequestDto): Observable<PersonResponseDto> {
    return this.http.post<ApiResponse<PersonResponseDto>>(this.personBase, body).pipe(
      map((res) => normalizePersonResponseDto(unwrapApiResponse(res))),
    );
  }

  /** PUT `/Person/{id}` — body `UpdatePersonRequestDto`. */
  update(id: number, body: UpdatePersonRequestDto): Observable<void> {
    return this.http.put<ApiResponse<string>>(`${this.personBase}/${id}`, body).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  /** DELETE `/Person/{id}` — baja lógica. 409 si tiene préstamos activos sin devolver. */
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.personBase}/${id}`).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  private catchEmptyList(
    err: unknown,
    pageNumber: number,
    pageSize: number,
  ): Observable<PagedResult<PersonResponseDto>> {
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
