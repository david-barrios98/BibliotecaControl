import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'bc.accessToken';
const REFRESH_TOKEN_KEY = 'bc.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setTokens(tokens: { accessToken: string; refreshToken?: string | null }): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken !== undefined) {
        if (tokens.refreshToken === null) localStorage.removeItem(REFRESH_TOKEN_KEY);
        else localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch {
      // no-op (storage disabled)
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // no-op
    }
  }
}

