/* ==========================================================================
   WildLens — API client
   Mirrors js/auth.js's apiFetch/apiBase exactly: same base-URL source, same
   token-header behavior, same "fails gracefully" philosophy. AuthContext
   builds login/signup/me on top of this.
   ========================================================================== */

const TOKEN_KEY = 'wl_token';
const USER_CACHE_KEY = 'wl_user_cache';

// Vite env var — set VITE_API_BASE in frontend/.env (see .env.example).
// Defaults to the same localhost:8000 the static version used.
export function apiBase() {
  return import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
}
export function isLoggedIn() {
  return !!getToken();
}
export function cachedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}
export function setCachedUser(user) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(apiBase() + path, { ...options, headers });
}

export async function apiJson(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await apiFetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }
  return data;
}
