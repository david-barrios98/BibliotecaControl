/** Alineado con Swagger: `Application.DTOs.Authors.AuthorRequestDto`. */
export interface AuthorRequestDto {
  name: string;
  lastName: string;
  /** ISO 8601 (date-time). */
  birthDate: string;
  country: string;
  biography?: string | null;
}

/** Alineado con Swagger: `Application.DTOs.Authors.AuthorResponseDto`. */
export interface AuthorResponseDto {
  id: number;
  name: string | null;
  lastName: string | null;
  birthDate: string;
  country: string | null;
  biography: string | null;
}
