/**
 * Pagination helper parameters and result structure
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Parses and sanitizes pagination query parameters with sensible bounds
 *
 * @param query - Request query object (e.g. req.query)
 * @param defaultLimit - Default items per page (default: 10)
 * @param maxLimit - Maximum allowed items per page (default: 50)
 */
export function parsePagination(
  query: Record<string, any>,
  defaultLimit = 10,
  maxLimit = 50
): PaginationParams {
  let page = parseInt(String(query.page || 1), 10);
  let limit = parseInt(String(query.limit || defaultLimit), 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

/**
 * Builds standard pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
