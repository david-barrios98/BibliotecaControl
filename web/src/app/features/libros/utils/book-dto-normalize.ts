import type { PagedResult } from '@core/models/paged-result';
import type { BookCopyDto, BookDetailResponseDto, BookResponseDto } from '../models/book.dto';

function record(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function str(r: Record<string, unknown>, camel: string, pascal: string): string {
  const v = r[camel] ?? r[pascal];
  return v == null ? '' : String(v);
}

function optStr(r: Record<string, unknown>, camel: string, pascal: string): string | null {
  const v = r[camel] ?? r[pascal];
  if (v == null || v === '') return null;
  return String(v);
}

function num(r: Record<string, unknown>, camel: string, pascal: string, fallback = 0): number {
  const v = r[camel] ?? r[pascal];
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function optNum(r: Record<string, unknown>, camel: string, pascal: string): number | null {
  const v = r[camel] ?? r[pascal];
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Listado suele devolver `uploads/...` sin `/` inicial; unificamos para el mismo flujo que en detalle. */
function canonicalCoverUrl(path: string | null): string | null {
  if (path == null || String(path).trim() === '') return null;
  const s = String(path).trim();
  if (s.startsWith('uploads/') || s === 'uploads') {
    return s.startsWith('/') ? s : `/${s}`;
  }
  return s;
}

/** Algunos endpoints devuelven PascalCase aunque el resto del API use camelCase. */
export function normalizeBookResponseDto(raw: unknown): BookResponseDto {
  const r = record(raw);
  return {
    id: num(r, 'id', 'Id', 0),
    title: str(r, 'title', 'Title'),
    numberOfPages: num(r, 'numberOfPages', 'NumberOfPages', 0),
    publishedDate: str(r, 'publishedDate', 'PublishedDate'),
    gender: optStr(r, 'gender', 'Gender'),
    genderId: optNum(r, 'genderId', 'GenderId'),
    authorId: num(r, 'authorId', 'AuthorId', 0),
    authorName: optStr(r, 'authorName', 'AuthorName'),
    coverUrl: canonicalCoverUrl(optStr(r, 'coverUrl', 'CoverUrl')),
  };
}

export function normalizeBookCopyDto(raw: unknown): BookCopyDto {
  const r = record(raw);
  return {
    id: num(r, 'id', 'Id', 0),
    bookId: num(r, 'bookId', 'BookId', 0),
    copyNumber: num(r, 'copyNumber', 'CopyNumber', 0),
    copyCode: str(r, 'copyCode', 'CopyCode'),
  };
}

export function normalizeBookDetailDto(raw: unknown): BookDetailResponseDto {
  const base = normalizeBookResponseDto(raw);
  const r = record(raw);
  const rawCopies = r['copies'] ?? r['Copies'];
  const copies = Array.isArray(rawCopies) ? rawCopies.map(normalizeBookCopyDto) : undefined;
  return { ...base, copies };
}

export function normalizePagedBookResult(raw: unknown): PagedResult<BookResponseDto> {
  const p = record(raw);
  const rawItems = p['items'] ?? p['Items'];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeBookResponseDto) : [];
  return {
    items,
    pageNumber: num(p, 'pageNumber', 'PageNumber', 1),
    pageSize: num(p, 'pageSize', 'PageSize', 10),
    totalRecords: num(p, 'totalRecords', 'TotalRecords', 0),
    totalPages: num(p, 'totalPages', 'TotalPages', 0),
  };
}
