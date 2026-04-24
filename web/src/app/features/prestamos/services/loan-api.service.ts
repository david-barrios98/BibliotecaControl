import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import type { PagedResult } from '@core/models/paged-result';
import { parseHttpError, unwrapApiResponse } from '@core/http/api-response-helpers';
import type { CreateLoanRequestDto, LoanListQuery, LoanResponseDto } from '../models/loan.dto';
import { normalizePagedLoanResult, normalizeLoanResponseDto } from '../utils/loan-dto-normalize';

@Injectable({ providedIn: 'root' })
export class LoanApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get loanBase(): string {
    return `${apiRootUrl(this.env)}/Loan`;
  }

  list(q: LoanListQuery): Observable<PagedResult<LoanResponseDto>> {
    let params = new HttpParams().set('pageNumber', String(q.pageNumber)).set('pageSize', String(q.pageSize));
    const st = (q.status ?? '').trim();
    if (st) params = params.set('status', st);
    if (q.bookId != null && q.bookId > 0) params = params.set('bookId', String(q.bookId));

    return this.http.get<ApiResponse<PagedResult<LoanResponseDto>>>(`${this.loanBase}/List`, { params }).pipe(
      map((res) => normalizePagedLoanResult(unwrapApiResponse(res))),
      catchError((err: unknown) => this.catchEmptyList(err, q)),
    );
  }

  create(body: CreateLoanRequestDto): Observable<LoanResponseDto> {
    return this.http.post<ApiResponse<LoanResponseDto>>(this.loanBase, body).pipe(
      map((res) => normalizeLoanResponseDto(unwrapApiResponse(res))),
    );
  }

  /** PUT `/Loan/{id}/return` — sin cuerpo. 409 si ya estaba devuelto. */
  returnLoan(id: number): Observable<void> {
    return this.http.put<ApiResponse<string>>(`${this.loanBase}/${id}/return`, {}).pipe(
      map((res) => {
        unwrapApiResponse(res);
      }),
    );
  }

  private catchEmptyList(err: unknown, q: LoanListQuery): Observable<PagedResult<LoanResponseDto>> {
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
