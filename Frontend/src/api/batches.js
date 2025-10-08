import { apiFetch } from './client';

export const fetchBatchMembers = async ({ branch, year, page, limit, signal } = {}) => {
  const searchParams = new URLSearchParams();

  if (branch) {
    searchParams.set('branch', branch);
  }

  if (year) {
    searchParams.set('year', year);
  }

  if (page) {
    searchParams.set('page', page);
  }

  if (limit) {
    searchParams.set('limit', limit);
  }

  const query = searchParams.toString();
  const path = `/batches${query ? `?${query}` : ''}`;

  return apiFetch(path, { method: 'GET', signal });
};
