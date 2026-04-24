import type { LoanResponseDto } from '../models/loan.dto';

/** Valores del query `status` en GET `/Loan/List` (convención típica; ajustar si el API difiere). */
export const LOAN_LIST_STATUS = {
  active: 'Active',
  returned: 'Returned',
} as const;

export function isLoanReturned(loan: LoanResponseDto): boolean {
  if (loan.returnedAt != null && String(loan.returnedAt).trim() !== '') return true;
  const s = (loan.status ?? '').toLowerCase();
  return s.includes('return') || s.includes('devuel');
}

export function loanPersonLabel(loan: LoanResponseDto): string {
  const named = (loan.personName ?? '').trim();
  if (named) return named;
  const fn = (loan.firstName ?? '').trim();
  const ln = (loan.lastName ?? '').trim();
  const parts = [fn, ln].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

export function loanCopyLabel(loan: LoanResponseDto): string {
  const code = (loan.copyCode ?? '').trim();
  if (code) return code;
  const n = loan.copyNumber;
  if (n != null && n > 0) return `#${n}`;
  const cid = loan.bookCopyId;
  if (cid != null && cid > 0) return `Ejemplar ${cid}`;
  return '—';
}
