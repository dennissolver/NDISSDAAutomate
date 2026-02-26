import type { Pagination, PaginatedResult } from '@pf/shared';
import { toCents, toDollars } from '@pf/shared';

export { toCents, toDollars };

export interface PaginationOpts {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function applyPagination<T>(
  query: T & { range: (from: number, to: number) => T },
  opts?: PaginationOpts,
): T {
  const page = opts?.page ?? DEFAULT_PAGE;
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

export function paginate<T>(
  data: T[],
  count: number,
  opts?: PaginationOpts,
): PaginatedResult<T> {
  const page = opts?.page ?? DEFAULT_PAGE;
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    },
  };
}

export function throwOnError<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('No data returned');
  return result.data;
}
