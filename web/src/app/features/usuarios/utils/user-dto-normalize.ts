import type { PagedResult } from '@core/models/paged-result';
import type { UserResponseDto } from '../models/user.dto';

function record(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
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

function optBool(r: Record<string, unknown>, camel: string, pascal: string): boolean | null {
  const v = r[camel] ?? r[pascal];
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
  return null;
}

export function normalizeUserResponseDto(raw: unknown): UserResponseDto {
  const r = record(raw);
  return {
    id: num(r, 'id', 'Id', 0),
    username: optStr(r, 'username', 'Username') ?? optStr(r, 'userName', 'UserName'),
    email: optStr(r, 'email', 'Email'),
    role: optStr(r, 'role', 'Role'),
    isActive: optBool(r, 'isActive', 'IsActive') ?? optBool(r, 'active', 'Active'),
    createdAt: optStr(r, 'createdAt', 'CreatedAt'),
  };
}

export function normalizePagedUserResult(raw: unknown): PagedResult<UserResponseDto> {
  const p = record(raw);
  const rawItems = p['items'] ?? p['Items'];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeUserResponseDto) : [];
  return {
    items,
    pageNumber: num(p, 'pageNumber', 'PageNumber', 1),
    pageSize: num(p, 'pageSize', 'PageSize', 10),
    totalRecords: num(p, 'totalRecords', 'TotalRecords', 0),
    totalPages: num(p, 'totalPages', 'TotalPages', 0),
  };
}

