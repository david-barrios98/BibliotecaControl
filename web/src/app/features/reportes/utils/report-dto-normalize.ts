import type { AuthorBookReportDto, TotalSummaryReportDto } from '../models/report.dto';

function record(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function str(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v != null && v !== '') return String(v);
  }
  return '';
}

function optNum(r: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = r[k];
    if (v == null || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function normalizeAuthorBookReportDto(raw: unknown): AuthorBookReportDto {
  const r = record(raw);
  const first = str(r, 'name', 'Name', 'authorName', 'AuthorName').trim();
  const last = str(r, 'lastName', 'LastName').trim();
  const full = [first, last].filter(Boolean).join(' ').trim();
  return {
    authorId: optNum(r, 'authorId', 'AuthorId', 'id', 'Id'),
    authorName: full || str(r, 'authorName', 'AuthorName', 'author', 'Author').trim() || '—',
    bookCount:
      optNum(
        r,
        'bookCount',
        'BookCount',
        'booksCount',
        'BooksCount',
        'bookCount',
        'BookCount',
        'books',
        'Books',
        'totalBooks',
        'TotalBooks',
        'count',
        'Count',
        'value',
        'Value',
      ) ?? 0,
    copyCount:
      optNum(
        r,
        'copyCount',
        'CopyCount',
        'copiesCount',
        'CopiesCount',
        'bookCopyCount',
        'BookCopyCount',
      ) ?? null,
    totalPages: optNum(r, 'totalPages', 'TotalPages'),
    avgPages: optNum(r, 'avgPages', 'AvgPages'),
  };
}

function normalizeTopAuthorsByPages(raw: unknown): { authorName: string; totalPages: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const r = record(x);
      const authorName = str(r, 'authorName', 'AuthorName', 'name', 'Name').trim() || '—';
      const totalPages = optNum(r, 'totalPages', 'TotalPages', 'pages', 'Pages', 'value', 'Value') ?? 0;
      return { authorName, totalPages };
    })
    .filter((x) => x.authorName !== '—' || x.totalPages !== 0);
}

function normalizeBooksCountByAuthor(raw: unknown): { authorName: string; bookCount: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const r = record(x);
      const authorName = str(r, 'authorName', 'AuthorName', 'name', 'Name').trim() || '—';
      const bookCount = optNum(r, 'bookCount', 'BookCount', 'booksCount', 'BooksCount', 'count', 'Count', 'value', 'Value') ?? 0;
      return { authorName, bookCount };
    })
    // No contemos filas “vacías” (evita inflar totales por registros incompletos).
    .filter((x) => x.authorName !== '—');
}

function normalizeAuthorsWithoutBooks(
  raw: unknown,
): { authorId?: number | null; name?: string | null; lastName?: string | null }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const r = record(x);
    return {
      authorId: optNum(r, 'authorId', 'AuthorId', 'id', 'Id'),
      name: str(r, 'name', 'Name').trim() || null,
      lastName: str(r, 'lastName', 'LastName').trim() || null,
    };
  });
}

export function normalizeTotalSummaryReportDto(raw: unknown): TotalSummaryReportDto {
  const r = record(raw);
  const topAuthorsByPages = normalizeTopAuthorsByPages(r['topAuthorsByPages'] ?? r['TopAuthorsByPages']);
  const booksCountByAuthor = normalizeBooksCountByAuthor(r['booksCountByAuthor'] ?? r['BooksCountByAuthor']);
  const authorsWithoutBooks = normalizeAuthorsWithoutBooks(r['authorsWithoutBooks'] ?? r['AuthorsWithoutBooks']);
  const averagePagesPerBook = optNum(r, 'averagePagesPerBook', 'AveragePagesPerBook');

  // Preferir totales del backend si existen.
  const backendTotalAuthors =
    optNum(r, 'totalAuthors', 'TotalAuthors', 'authorsCount', 'AuthorsCount', 'totalAuthorCount', 'TotalAuthorCount') ?? null;
  const backendTotalBooks =
    optNum(r, 'totalBooks', 'TotalBooks', 'booksCount', 'BooksCount', 'totalBookCount', 'TotalBookCount') ?? null;

  // Fallback: deduplicar por nombre para evitar inflar totales.
  const namesWithBooks = new Set(booksCountByAuthor.map((x) => x.authorName).filter(Boolean));
  const namesWithoutBooks = new Set(
    (authorsWithoutBooks ?? [])
      .map((a) => [a.name, a.lastName].filter(Boolean).join(' ').trim())
      .filter((n) => n !== ''),
  );
  const totalAuthors = backendTotalAuthors ?? new Set([...namesWithBooks, ...namesWithoutBooks]).size;
  const totalBooks = backendTotalBooks ?? booksCountByAuthor.reduce((acc, x) => acc + (x.bookCount ?? 0), 0);

  return {
    topAuthorsByPages,
    booksCountByAuthor,
    authorsWithoutBooks,
    averagePagesPerBook,
    totalAuthors,
    totalBooks,
    avgPages: averagePagesPerBook,
  };
}

