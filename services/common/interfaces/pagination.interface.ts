export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 'ASC' | 'DESC' | 1 | -1>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationOptions {
  limit?: number;
  sort?: Record<string, 'ASC' | 'DESC' | 1 | -1>;
  lastId?: string;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  lastId?: string;
  hasMore: boolean;
} 