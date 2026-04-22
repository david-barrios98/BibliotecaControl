/** Mirrors backend `PagedResult<T>` for list endpoints. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}
