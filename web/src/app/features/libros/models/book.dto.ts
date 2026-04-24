/** Listados paginados (`GET Book/List`). */
export interface BookResponseDto {
  id: number;
  title: string;
  numberOfPages: number;
  publishedDate: string;
  gender?: string | null;
  genderId?: number | null;
  authorId: number;
  authorName?: string | null;
  coverUrl?: string | null;
  /** Primer ejemplar activo del libro (puede venir null si no hay copias activas). */
  copyNumber?: number | null;
  /** Código del primer ejemplar activo (puede venir null si no hay copias activas). */
  copyCode?: string | null;
}

/** Detalle (`GET Book/{id}`) con ejemplares activos. */
export interface BookCopyDto {
  id: number;
  bookId: number;
  copyNumber: number;
  /** Obligatorio en API (alta/edición de ejemplar). */
  copyCode: string;
}

export interface BookDetailResponseDto extends BookResponseDto {
  gender?: string | null;
  genderId?: number | null;
  copies?: BookCopyDto[] | null;
}

export interface AddBookCopyRequestDto {
  copyCode: string;
}

/** PUT `/Book/{id}/Copies/{copyId}` — `copyCode` obligatorio. */
export interface UpdateBookCopyRequestDto {
  copyCode: string;
}

/** Respuesta 200 del PUT de ejemplar (misma forma que en detalle). */
export type BookCopyResponseDto = BookCopyDto;

export interface BookListQuery {
  pageNumber: number;
  pageSize: number;
  authorId?: number | null;
  searchTerm?: string | null;
}
