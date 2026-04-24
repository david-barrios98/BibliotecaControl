import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import { unwrapApiResponse } from '@core/http/api-response-helpers';
import type { AuthorBookReportDto, TotalSummaryReportDto } from '../models/report.dto';
import { normalizeAuthorBookReportDto, normalizeTotalSummaryReportDto } from '../utils/report-dto-normalize';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get reportBase(): string {
    return `${apiRootUrl(this.env)}/Report`;
  }

  authorsBooksSummary(): Observable<AuthorBookReportDto[]> {
    return this.http.get<ApiResponse<unknown>>(`${this.reportBase}/Authors-Books-Summary`).pipe(
      map((res) => unwrapApiResponse(res)),
      map((raw) => (Array.isArray(raw) ? raw.map(normalizeAuthorBookReportDto) : [])),
    );
  }

  totalSummary(): Observable<TotalSummaryReportDto> {
    return this.http.get<ApiResponse<unknown>>(`${this.reportBase}/Total-Summary`).pipe(
      map((res) => normalizeTotalSummaryReportDto(unwrapApiResponse(res))),
    );
  }
}

