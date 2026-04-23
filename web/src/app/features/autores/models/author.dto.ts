/** Alineado con Swagger: `Application.DTOs.Authors.AuthorRequestDto`. */
export interface AuthorRequestDto {
  name: string;
  lastName: string;
  /** ISO 8601 (date-time). */
  birthDate: string;
  countryId: number;
  biography?: string | null;
}

/** Alineado con Swagger: `Application.DTOs.Authors.AuthorResponseDto`. */
export interface AuthorResponseDto {
  id: number;
  name: string | null;
  lastName: string | null;
  birthDate: string;
  /** Id del país asociado (nuevo contrato). */
  countryId?: number | null;
  /** Nombre del país (si el backend lo expone para UI). */
  countryName?: string | null;
  /** Compat legado: algunos endpoints podrían seguir enviando `country` como texto. */
  country?: string | null;
  biography: string | null;
}
