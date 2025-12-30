export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

let bearerToken = null;

export const setApiAuthToken = (token) => {
  bearerToken = token || null;
};

export const getApiAuthToken = () => bearerToken;

export const clearApiAuthToken = () => {
  bearerToken = null;
};

const defaultHeaders = {};

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
  const {
    headers = {},
    body,
    method = 'GET',
    withCredentials = true,
    skipJson = false,
    omitAuth = false,
    ...rest
  } = options;
  const init = {
    method,
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      ...defaultHeaders,
      ...headers
    },
    ...rest
  };

  if (!omitAuth && bearerToken && !init.headers.Authorization) {
    init.headers.Authorization = `Bearer ${bearerToken}`;
  }

  if (body !== undefined) {
    init.body = skipJson ? body : JSON.stringify(body);
    if (!skipJson && !(body instanceof FormData)) {
      init.headers['Content-Type'] = 'application/json';
    }
  } else {
    // Avoid setting content-type on GET/HEAD to prevent unnecessary preflight
    if (['GET', 'HEAD'].includes(method.toUpperCase())) {
      delete init.headers['Content-Type'];
    }
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
