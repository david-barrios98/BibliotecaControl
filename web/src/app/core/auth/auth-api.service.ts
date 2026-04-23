import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, tap } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import { unwrapApiResponse } from '@core/http/api-response-helpers';
import type { LoginRequestDto, LoginResponseDto } from './auth.models';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  private readonly session = inject(AuthSessionService);

  private get authBase(): string {
    return `${apiRootUrl(this.env)}/Auth`;
  }

  login(body: LoginRequestDto) {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.authBase}/login`, body).pipe(
      map((res) => unwrapApiResponse(res)),
      tap((data) => this.session.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null })),
    );
  }
}

