/** Mirrors backend `ApiResponse<T>` contract (camelCase in JSON). */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errors: string[];
}
