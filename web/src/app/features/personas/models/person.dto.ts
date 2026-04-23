/** Lectura (`GET Person/{id}`, ítems de lista). */
export interface PersonResponseDto {
  id: number;
  firstName: string | null;
  lastName: string | null;
  nationalId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

/** Campos comunes alta/edición (POST `CreatePersonRequestDto`, PUT `UpdatePersonRequestDto`). */
interface PersonUpsertPayload {
  firstName: string;
  lastName: string;
  nationalId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

/** Body POST `/Person`. 409 si el email ya está en uso en otra persona activa. */
export type CreatePersonRequestDto = PersonUpsertPayload;

/** Body PUT `/Person/{id}`. 409 si el email pertenece a otra persona. */
export type UpdatePersonRequestDto = PersonUpsertPayload;
