/**
 * Fecha civil sin hora para inputs `type="date"` y el contrato date-time del API.
 */

/** Convierte una fecha ISO del API al valor `YYYY-MM-DD` para `<input type="date">`. */
export function isoToDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const fromIsoPrefix = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  if (fromIsoPrefix) {
    return fromIsoPrefix[1];
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Convierte `YYYY-MM-DD` del input a ISO 8601 (mediodía UTC del día)
 * para evitar desplazamientos de día al interpretar la fecha en el servidor.
 */
export function dateInputToIsoUtcNoon(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(yyyyMmDd).toISOString();
  }
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();
}

/** Solo día / mes / año (sin hora), usando la parte calendario del ISO si existe. */
export function formatIsoDateDisplay(
  iso: string | null | undefined,
  monthStyle: 'short' | 'long' = 'long',
): string {
  if (!iso) return '—';
  const prefix = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (prefix) {
    const y = +prefix[1];
    const mo = +prefix[2];
    const d = +prefix[3];
    const dt = new Date(y, mo - 1, d);
    return dt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: monthStyle,
      day: 'numeric',
    });
  }
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: monthStyle,
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
