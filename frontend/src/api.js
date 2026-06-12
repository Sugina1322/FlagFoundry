const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function token() {
  return localStorage.getItem('flagfoundry_token');
}

export function setSession(data) {
  localStorage.setItem('flagfoundry_token', data.token);
  localStorage.setItem('flagfoundry_user', JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem('flagfoundry_token');
  localStorage.removeItem('flagfoundry_user');
}

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || body.error || `Request failed: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export { API_URL };

