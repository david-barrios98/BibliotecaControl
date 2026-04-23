import type { FieldValidationOverrides } from '@shared/validation/validation-messages';

/** Mensajes por campo para alta/edición de autor (sobrescriben los textos por defecto). */
export const authorFieldMessages: Record<string, FieldValidationOverrides> = {
  name: {
    required: 'Indique el nombre del autor.',
    maxlength: (e) => `El nombre admite como máximo ${e.requiredLength} caracteres.`,
  },
  lastName: {
    required: 'Indique los apellidos.',
    maxlength: (e) => `Los apellidos admiten como máximo ${e.requiredLength} caracteres.`,
  },
  birthDate: {
    required: 'Seleccione la fecha y hora de nacimiento.',
  },
  country: {
    required: 'Indique el país.',
    maxlength: (e) => `El país admite como máximo ${e.requiredLength} caracteres.`,
  },
  biography: {
    maxlength: (e) => `La biografía admite como máximo ${e.requiredLength} caracteres.`,
  },
};
