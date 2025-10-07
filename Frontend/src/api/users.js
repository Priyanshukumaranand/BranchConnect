import { apiFetch } from './client';

export const fetchProfile = () =>
  apiFetch('/users/me', { method: 'GET' });

export const updateProfile = (payload) => {
  const formData = payload instanceof FormData ? payload : new FormData();

  if (!(payload instanceof FormData)) {
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
  }

  return apiFetch('/users/me', {
    method: 'PUT',
    body: formData,
    skipJson: true
  });
};
