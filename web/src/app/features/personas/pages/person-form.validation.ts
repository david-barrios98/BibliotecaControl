import type { FieldValidationOverrides } from '@shared/validation/validation-messages';

export const personFieldMessages: Record<string, FieldValidationOverrides> = {
  firstName: {
    required: 'Indique el nombre.',
    maxlength: (e) => `Como máximo ${e.requiredLength} caracteres.`,
  },
  lastName: {
    required: 'Indique los apellidos.',
    maxlength: (e) => `Como máximo ${e.requiredLength} caracteres.`,
  },
  nationalId: {
    maxlength: (e) => `Como máximo ${e.requiredLength} caracteres.`,
  },
  email: {
    email: 'Introduce un correo válido.',
    maxlength: (e) => `Como máximo ${e.requiredLength} caracteres.`,
  },
  phone: {
    maxlength: (e) => `Como máximo ${e.requiredLength} caracteres.`,
  },
  address: {
    maxlength: (e) => `Como máximo ${e.requiredLength} caracteres.`,
  },
};
