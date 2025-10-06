const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error((payload && payload.error) || response.statusText);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const apiFetch = async (path, options = {}) => {
  const { headers = {}, body, method = 'GET', withCredentials = true, skipJson = false, ...rest } = options;
  const init = {
    method,
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      ...defaultHeaders,
      ...headers
    },
    ...rest
  };

  if (body !== undefined) {
    init.body = skipJson ? body : JSON.stringify(body);
  }

  // Allow overriding content-type (e.g., FormData)
  if (skipJson || body instanceof FormData) {
    delete init.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  return parseResponse(response);
};

export const fetchCsrfToken = async () => {
  try {
    const response = await apiFetch('/api/csrf-token', { method: 'GET' });
    return response?.csrfToken;
  } catch (error) {
    console.warn('Unable to fetch CSRF token:', error);
    return null;
  }
};
