import { PaginationParams } from "../types";

export interface PaginationOptions {
  skip: number;
  take: number;
}

export function getPaginationParams(
  params: PaginationParams
): PaginationOptions {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
