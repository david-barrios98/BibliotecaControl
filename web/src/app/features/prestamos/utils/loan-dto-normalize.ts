import type { PagedResult } from '@core/models/paged-result';
import type { LoanResponseDto } from '../models/loan.dto';

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

function optStrMany(r: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k];
    if (v != null && v !== '') return String(v);
  }
  return null;
}

function num(r: Record<string, unknown>, camel: string, pascal: string, fallback = 0): number {
  const v = r[camel] ?? r[pascal];
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function optNum(r: Record<string, unknown>, camel: string, pascal: string): number | null {
  const v = r[camel] ?? r[pascal];
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeLoanResponseDto(raw: unknown): LoanResponseDto {
  const r = record(raw);
  return {
    id: num(r, 'id', 'Id', 0),
    personId: num(r, 'personId', 'PersonId', 0),
    personName: optStr(r, 'personName', 'PersonName'),
    firstName: optStr(r, 'firstName', 'FirstName'),
    lastName: optStr(r, 'lastName', 'LastName'),
    bookId: num(r, 'bookId', 'BookId', 0),
    bookTitle: optStr(r, 'bookTitle', 'BookTitle'),
    bookCopyId: optNum(r, 'bookCopyId', 'BookCopyId'),
    copyNumber: optNum(r, 'copyNumber', 'CopyNumber') ?? optNum(r, 'bookCopyNumber', 'BookCopyNumber'),
    copyCode:
      optStrMany(r, 'copyCode', 'CopyCode', 'bookCopyCode', 'BookCopyCode', 'bookCopy', 'BookCopy') ??
      optStrMany(r, 'bookCopyCodeValue', 'BookCopyCodeValue'),
    loanDate: str(r, 'loanDate', 'LoanDate'),
    dueDate: optStr(r, 'dueDate', 'DueDate'),
    returnedAt: optStrMany(
      r,
      'returnedAt',
      'ReturnedAt',
      'returnedDate',
      'ReturnedDate',
      'returnDate',
      'ReturnDate',
      'returnAt',
      'ReturnAt',
      'returnedOn',
      'ReturnedOn',
      'returnOn',
      'ReturnOn',
    ),
    status: optStr(r, 'status', 'Status'),
  };
}

export function normalizePagedLoanResult(raw: unknown): PagedResult<LoanResponseDto> {
  const p = record(raw);
  const rawItems = p['items'] ?? p['Items'];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeLoanResponseDto) : [];
  return {
    items,
    pageNumber: num(p, 'pageNumber', 'PageNumber', 1),
    pageSize: num(p, 'pageSize', 'PageSize', 10),
    totalRecords: num(p, 'totalRecords', 'TotalRecords', 0),
    totalPages: num(p, 'totalPages', 'TotalPages', 0),
  };
}
