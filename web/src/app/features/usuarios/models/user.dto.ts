/** Query GET `/User/List`. */
export interface UserListQuery {
  pageNumber: number;
  pageSize: number;
  search?: string | null;
}

/** Respuesta de usuario (forma flexible según backend). */
export interface UserResponseDto {
  id: number;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
}

/** POST `/User` (solo Admin). */
export interface CreateUserRequestDto {
  username: string;
  password: string;
  email?: string | null;
  role: string;
}

/** PUT `/User/{id}` (solo Admin). */
export interface UpdateUserRequestDto {
  username: string;
  email?: string | null;
  role: string;
  /** Si se envía, el backend resetea password. */
  password?: string | null;
}

