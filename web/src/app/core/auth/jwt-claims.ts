export type JwtClaims = Record<string, unknown>;

function base64UrlToString(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  // atob existe en navegador; Angular corre en web.
  return atob(padded);
}

export function parseJwtClaims(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = base64UrlToString(parts[1]);
    const obj = JSON.parse(json);
    if (obj == null || typeof obj !== 'object') return null;
    return obj as JwtClaims;
  } catch {
    return null;
  }
}

function toStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [String(v)];
}

/** Extrae roles de claims comunes (ASP.NET / JWT estándar / custom). */
export function getJwtRoles(claims: JwtClaims | null | undefined): string[] {
  if (!claims) return [];
  const roleKeys = [
    'role',
    'roles',
    'Role',
    'Roles',
    // ASP.NET Core default claim types
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
  ];
  for (const k of roleKeys) {
    if (k in claims) return toStringArray(claims[k]);
  }
  return [];
}

