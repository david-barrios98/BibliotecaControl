/** Fila del reporte GET `/Report/Authors-Books-Summary`. */
export interface AuthorBookReportDto {
  authorId?: number | null;
  /** Nombre para UI (ej. "Ada Lovelace"). */
  authorName: string;
  bookCount: number;
  /** Cantidad de ejemplares activos (cuando el backend lo envía). */
  copyCount?: number | null;
  totalPages?: number | null;
  avgPages?: number | null;
}

/** Respuesta GET `/Report/Total-Summary` (shape flexible). */
export interface TotalSummaryReportDto {
  /** Top autores por páginas totales. */
  topAuthorsByPages?: { authorName: string; totalPages: number }[] | null;
  /** Autores sin libros. */
  authorsWithoutBooks?: { authorId?: number | null; name?: string | null; lastName?: string | null }[] | null;
  /** Promedio de páginas por libro. */
  averagePagesPerBook?: number | null;
  /** Cantidad de libros por autor. */
  booksCountByAuthor?: { authorName: string; bookCount: number }[] | null;

  /** Derivados (para KPIs). */
  totalAuthors?: number | null;
  totalBooks?: number | null;
  avgPages?: number | null;
}

