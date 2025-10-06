import { apiFetch } from './client';

export const fetchBatchMembers = async ({ year, signal } = {}) => {
  const searchParams = new URLSearchParams();

  if (year) {
    searchParams.set('year', year);
  }

  const query = searchParams.toString();
  const path = `/batches${query ? `?${query}` : ''}`;

  return apiFetch(path, { method: 'GET', signal });
};
