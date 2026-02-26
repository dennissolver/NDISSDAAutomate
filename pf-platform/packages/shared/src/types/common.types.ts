/**
 * Money is always stored as integer cents to avoid floating-point errors.
 * Display layer converts to AUD with 2 decimal places.
 */
export type Cents = number;

export interface AuditMeta {
  createdAt: Date;
  updatedAt: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Period {
  month: number; // 1-12
  year: number;  // e.g. 2026
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}
