import { apiFetch } from './client';

export const fetchDsaLeaderboard = async ({ signal, limit } = {}) => {
  const searchParams = new URLSearchParams();

  if (limit) {
    searchParams.set('limit', limit);
  }

  const path = `/resources/dsa-leaderboard${searchParams.toString() ? `?${searchParams}` : ''}`;

  return apiFetch(path, { method: 'GET', signal });
};
