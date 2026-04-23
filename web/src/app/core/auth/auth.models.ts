export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RefreshRequestDto {
  refreshToken: string;
}

/**
 * Shape esperado por backend (típico): { accessToken, refreshToken, ... }.
 * Se dejan campos opcionales para tolerar cambios menores sin romper compilación.
 */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string | null;
  expiresInSeconds?: number | null;
  tokenType?: string | null;
}

export type RefreshResponseDto = LoginResponseDto;

