import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import type { PagedResult } from '@core/models/paged-result';
import { parseHttpError, unwrapApiResponse } from '@core/http/api-response-helpers';
import type {
  AddBookCopyRequestDto,
  BookCopyResponseDto,
  BookDetailResponseDto,
  BookListQuery,
  BookResponseDto,
  UpdateBookCopyRequestDto,
} from '../models/book.dto';

export interface BookUpsertPayload {
  title: string;
  numberOfPages: number;
  publishedDate: string; // ISO date-time
  genderId: number;
  authorId: number;
  coverImage?: File | null;
}

@Injectable({ providedIn: 'root' })
export class BookApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get bookBase(): string {
    return `${apiRootUrl(this.env)}/Book`;
  }

  list(q: BookListQuery): Observable<PagedResult<BookResponseDto>> {
    let params = new HttpParams()
      .set('pageNumber', String(q.pageNumber))
      .set('pageSize', String(q.pageSize));
    if (q.authorId) params = params.set('authorId', String(q.authorId));
    const st = (q.searchTerm ?? '').trim();
    if (st) params = params.set('searchTerm', st);

    return this.http.get<ApiResponse<PagedResult<BookResponseDto>>>(`${this.bookBase}/List`, { params }).pipe(
      map((res) => unwrapApiResponse(res)),
      catchError((err: unknown) => this.catchEmptyList(err, q)),
    );
  }

  /** Detalle con ejemplares (`copies`). */
  getById(id: number): Observable<BookDetailResponseDto> {
    return this.http.get<ApiResponse<BookDetailResponseDto>>(`${this.bookBase}/${id}`).pipe(
      map((res) => unwrapApiResponse(res)),
    );
  }

  create(body: BookUpsertPayload): Observable<BookResponseDto> {
    return this.http.post<ApiResponse<BookResponseDto>>(this.bookBase, this.toFormData(body)).pipe(
      map((res) => unwrapApiResponse(res)),
    );
  }

  update(id: number, body: BookUpsertPayload): Observable<void> {
    return this.http.put<ApiResponse<string>>(`${this.bookBase}/${id}`, this.toFormData(body)).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.bookBase}/${id}`).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  /** POST `/Book/{id}/Copies` — body JSON opcional `{ copyCode }`. */
  addCopy(bookId: number, body: AddBookCopyRequestDto): Observable<void> {
    const payload =
      body.copyCode != null && String(body.copyCode).trim() !== ''
        ? { copyCode: String(body.copyCode).trim() }
        : {};
    return this.http.post<ApiResponse<unknown>>(`${this.bookBase}/${bookId}/Copies`, payload).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  /** PUT `/Book/{id}/Copies/{copyId}` — actualiza código; vacío/null lo quita. **409** si duplicado. */
  updateCopy(bookId: number, copyId: number, body: UpdateBookCopyRequestDto): Observable<BookCopyResponseDto> {
    return this.http
      .put<ApiResponse<BookCopyResponseDto>>(`${this.bookBase}/${bookId}/Copies/${copyId}`, body)
      .pipe(map((res) => unwrapApiResponse(res)));
  }

  /** DELETE `/Book/{id}/Copies/{copyId}` — baja lógica. **409** si es el único activo o hay préstamo activo. */
  deleteCopy(bookId: number, copyId: number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.bookBase}/${bookId}/Copies/${copyId}`).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  private toFormData(v: BookUpsertPayload): FormData {
    const fd = new FormData();
    fd.set('Title', v.title);
    fd.set('NumberOfPages', String(v.numberOfPages));
    fd.set('PublishedDate', v.publishedDate);
    fd.set('GenderId', String(v.genderId));
    fd.set('AuthorId', String(v.authorId));
    if (v.coverImage) {
      fd.set('CoverImage', v.coverImage);
    }
    return fd;
  }

  private catchEmptyList(err: unknown, q: BookListQuery): Observable<PagedResult<BookResponseDto>> {
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
