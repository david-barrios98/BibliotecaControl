/** Body POST `/Loan` — JSON: libro, persona registrada y vigencia del préstamo. */
export interface CreateLoanRequestDto {
  bookId: number;
  personId: number;
  /** ISO 8601 (date-time). */
  loanDate: string;
  /** ISO 8601 (date-time). */
  dueDate: string;
}

/** Filtros GET `/Loan/List` (solo se envían los definidos). */
export interface LoanListQuery {
  pageNumber: number;
  pageSize: number;
  /** Ej.: `Active`, `Returned` — depende del API; omitir para todos. */
  status?: string | null;
  bookId?: number | null;
}

/** Ítem de listado/detalle (`LoanResponseDto`). Campos opcionales por variaciones del API. */
export interface LoanResponseDto {
  id: number;
  personId: number;
  /** Texto ya compuesto para UI cuando el backend lo envía */
  personName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bookId: number;
  bookTitle?: string | null;
  /** Opcional si el API no asigna ejemplar explícito en la respuesta. */
  bookCopyId?: number | null;
  copyNumber?: number | null;
  copyCode?: string | null;
  loanDate: string;
  dueDate?: string | null;
  returnedAt?: string | null;
  /** Si viene explícito (alternativa a inferir por `returnedAt`). */
  status?: string | null;
}
