import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  apiFetch, apiBase, getToken, setToken, clearToken,
  isLoggedIn as tokenIsLoggedIn, cachedUser, setCachedUser,
} from '../api/client';

/* ==========================================================================
   WildLens — AuthContext
   A faithful port of js/auth.js: guest-first (identify/browse/read never
   require login), token in localStorage, cached user info, and a
   requireAuth(callback) gate that opens <AuthGateModal> for guests trying a
   gated action (save, post, like, comment, anything in AI Studio).
   Calls the exact same FastAPI endpoints — the backend's auth contract is
   untouched.
   ========================================================================== */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => cachedUser());
  const [loggedIn, setLoggedIn] = useState(() => tokenIsLoggedIn());
  const [gateOpen, setGateOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!tokenIsLoggedIn()) return null;
    try {
      const res = await apiFetch('/auth/me');
      if (!res.ok) {
        if (res.status === 401) {
          clearToken();
          setLoggedIn(false);
          setUser(null);
        }
        return null;
      }
      const data = await res.json();
      setCachedUser(data);
      setUser(data);
      return data;
    } catch {
      // API unreachable — fall back to last-known state, same as js/auth.js
      return cachedUser();
    }
  }, []);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Incorrect email or password');
    setToken(data.access_token);
    setLoggedIn(true);
    await refreshUser();
    return data;
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await fetch(`${apiBase()}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Could not sign in with Google');
    setToken(data.access_token);
    setLoggedIn(true);
    await refreshUser();
    return data;
  }, [refreshUser]);

  const signup = useCallback(async (fullName, email, password) => {
    const res = await fetch(`${apiBase()}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Could not create your account');
    setToken(data.access_token);
    setLoggedIn(true);
    await refreshUser();
    return data;
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearToken();
    setLoggedIn(false);
    setUser(null);
  }, []);

  /* ---- Auth gate: wrap any action that requires a logged-in user ----
     Usage: requireAuth(() => doTheGatedThing()) — same call signature and
     behavior as WL.auth.requireAuth() in the static version: runs the
     callback immediately if already logged in, otherwise opens
     <AuthGateModal> (which links to /login or /signup with ?next=) and
     does NOT run the callback — same as the original, which only ever
     navigated away rather than resuming the gated action inline. */
  const requireAuth = useCallback((onAuthenticated) => {
    if (tokenIsLoggedIn()) {
      if (onAuthenticated) onAuthenticated();
      return true;
    }
    setGateOpen(true);
    return false;
  }, []);

  const closeGate = useCallback(() => setGateOpen(false), []);

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  };

  const value = {
    user, loggedIn, login, loginWithGoogle, signup, logout, refreshUser,
    requireAuth, gateOpen, closeGate,
    initials: () => initials(user && user.full_name),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
