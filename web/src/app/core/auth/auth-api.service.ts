import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, tap } from 'rxjs';
import { apiRootUrl, ENVIRONMENT } from '@core/config/environment.token';
import type { ApiResponse } from '@core/models/api-response';
import { unwrapApiResponse } from '@core/http/api-response-helpers';
import type { LoginRequestDto, LoginResponseDto, RefreshRequestDto, RefreshResponseDto } from './auth.models';
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

  refresh(body: RefreshRequestDto) {
    return this.http.post<ApiResponse<RefreshResponseDto>>(`${this.authBase}/refresh`, body).pipe(
      map((res) => unwrapApiResponse(res)),
      tap((data) => this.session.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null })),
    );
  }

  /**
   * Si el backend requiere body, enviamos { refreshToken } cuando existe.
   * Igual limpiamos sesión en cliente.
   */
  logout() {
    const refreshToken = this.session.getRefreshToken();
    const body = refreshToken ? ({ refreshToken } as const) : null;
    return this.http.post<ApiResponse<string>>(`${this.authBase}/logout`, body).pipe(
      map((res) => unwrapApiResponse(res)),
      tap(() => this.session.clear()),
    );
  }
}

