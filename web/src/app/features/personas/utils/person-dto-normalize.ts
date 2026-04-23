import type { PagedResult } from '@core/models/paged-result';
import type { PersonResponseDto } from '../models/person.dto';

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

export function normalizePersonResponseDto(raw: unknown): PersonResponseDto {
  const r = record(raw);
  return {
    id: num(r, 'id', 'Id', 0),
    firstName: str(r, 'firstName', 'FirstName'),
    lastName: str(r, 'lastName', 'LastName'),
    nationalId: optStr(r, 'nationalId', 'NationalId'),
    email: optStr(r, 'email', 'Email'),
    phone: optStr(r, 'phone', 'Phone'),
    address: optStr(r, 'address', 'Address'),
  };
}

export function normalizePagedPersonResult(raw: unknown): PagedResult<PersonResponseDto> {
  const p = record(raw);
  const rawItems = p['items'] ?? p['Items'];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizePersonResponseDto) : [];
  return {
    items,
    pageNumber: num(p, 'pageNumber', 'PageNumber', 1),
    pageSize: num(p, 'pageSize', 'PageSize', 10),
    totalRecords: num(p, 'totalRecords', 'TotalRecords', 0),
    totalPages: num(p, 'totalPages', 'TotalPages', 0),
  };
}
