import { apiFetch, API_BASE_URL, getApiAuthToken } from './client';

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

export const updatePassword = (payload) => {
  return apiFetch('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const fetchUserByEmail = (email) => {
  if (!email) {
    return Promise.reject(new Error('Email is required to fetch user.'));
  }

  const searchParams = new URLSearchParams({ email });
  return apiFetch(`/users/lookup/email?${searchParams.toString()}`, { method: 'GET' });
};

export const fetchUserById = (userId) => {
  if (!userId) {
    return Promise.reject(new Error('User id is required.'));
  }

  return apiFetch(`/users/${userId}`, { method: 'GET' });
};

export const fetchAvatarByEmail = async (email) => {
  if (!email) {
    throw new Error('Email is required to fetch avatar.');
  }

  const searchParams = new URLSearchParams({ email });
  const response = await fetch(`${API_BASE_URL}/users/avatar/by-email?${searchParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: (() => {
      const token = getApiAuthToken();
      if (!token) {
        return undefined;
      }
      return {
        Authorization: `Bearer ${token}`
      };
    })()
  });

  if (!response.ok) {
    const error = new Error(response.statusText || 'Failed to fetch avatar');
    error.status = response.status;
    throw error;
  }

  return response.blob();
};
