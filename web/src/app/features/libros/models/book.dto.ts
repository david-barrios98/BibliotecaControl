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
}

/** Detalle (`GET Book/{id}`) con ejemplares activos. */
export interface BookCopyDto {
  id: number;
  bookId: number;
  copyNumber: number;
  copyCode?: string | null;
}

export interface BookDetailResponseDto extends BookResponseDto {
  gender?: string | null;
  genderId?: number | null;
  copies?: BookCopyDto[] | null;
}

export interface AddBookCopyRequestDto {
  copyCode?: string | null;
}

/** PUT `/Book/{id}/Copies/{copyId}` — `copyCode` vacío o null quita el código. */
export interface UpdateBookCopyRequestDto {
  copyCode?: string | null;
}

/** Respuesta 200 del PUT de ejemplar (misma forma que en detalle). */
export type BookCopyResponseDto = BookCopyDto;

export interface BookListQuery {
  pageNumber: number;
  pageSize: number;
  authorId?: number | null;
  searchTerm?: string | null;
}
