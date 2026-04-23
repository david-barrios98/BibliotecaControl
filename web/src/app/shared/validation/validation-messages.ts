import type { ValidationErrors } from '@angular/forms';

/** Orden en que se muestra el primer error si hay varios a la vez. */
export const DEFAULT_VALIDATION_ERROR_ORDER = [
  'required',
  'email',
  'minlength',
  'maxlength',
  'min',
  'max',
  'pattern',
] as const;

export type FieldValidationOverrides = Partial<{
  required: string | ((error: true) => string);
  email: string | ((error: unknown) => string);
  minlength: string | ((error: { requiredLength: number; actualLength: number }) => string);
  maxlength: string | ((error: { requiredLength: number; actualLength: number }) => string);
  min: string | ((error: { min: number; actual: number }) => string);
  max: string | ((error: { max: number; actual: number }) => string);
  pattern: string | ((error: { requiredPattern: string }) => string);
}>;

type Resolver = (error: unknown) => string;

const defaultResolvers: Record<string, Resolver> = {
  required: () => 'Este campo es obligatorio.',
  email: () => 'Introduzca un correo electrónico válido.',
  minlength: (e) => {
    const err = e as { requiredLength: number; actualLength: number };
    return `Use al menos ${err.requiredLength} caracteres (tiene ${err.actualLength}).`;
  },
  maxlength: (e) => {
    const err = e as { requiredLength: number; actualLength: number };
    return `Como máximo ${err.requiredLength} caracteres (tiene ${err.actualLength}).`;
  },
  min: (e) => {
    const err = e as { min: number; actual: number };
    return `El valor mínimo es ${err.min}.`;
  },
  max: (e) => {
    const err = e as { max: number; actual: number };
    return `El valor máximo es ${err.max}.`;
  },
  pattern: () => 'El formato no es válido.',
};

function resolveKey(
  key: string,
  errorPayload: unknown,
  overrides: FieldValidationOverrides,
): string | null {
  const o = overrides[key as keyof FieldValidationOverrides];
  if (typeof o === 'function') {
    return (o as (err: unknown) => string)(errorPayload);
  }
  if (typeof o === 'string') {
    return o;
  }
  const def = defaultResolvers[key];
  return def ? def(errorPayload) : null;
}

const ORDER_SET = new Set<string>(DEFAULT_VALIDATION_ERROR_ORDER);

/**
 * Primer mensaje de error según el orden configurable,
 * luego el resto de claves presentes en `errors`.
 */
export function firstValidationMessage(
  errors: ValidationErrors | null | undefined,
  overrides: FieldValidationOverrides = {},
): string | null {
  if (!errors) {
    return null;
  }
  const keys = Object.keys(errors);
  if (keys.length === 0) {
    return null;
  }

  const orderedKeys: string[] = [
    ...DEFAULT_VALIDATION_ERROR_ORDER.filter((k) => k in errors),
    ...keys.filter((k) => !ORDER_SET.has(k)),
  ];

  for (const key of orderedKeys) {
    const msg = resolveKey(key, errors[key], overrides);
    if (msg) {
      return msg;
    }
  }

  return 'Valor no válido.';
}
