import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, getToken } from '../api/client';
import { setCurrentUserName, setCurrentUserRole } from '../data/currentUser';

const TOKEN_KEY = 'syncspace-token';
const AuthContext = createContext(null);

/**
 * Single source of truth for "who is logged in and what role do they have".
 * Role always comes from the backend (JWT payload / /auth/me), never from a
 * value the frontend invented — so route protection here can't be spoofed
 * by editing localStorage alone (the protected API routes re-check the JWT
 * server-side regardless).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous

  const applySession = useCallback((token, nextUser) => {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
    setStatus(nextUser ? 'authenticated' : 'anonymous');
    if (nextUser) {
      setCurrentUserName(nextUser.name);
      setCurrentUserRole(nextUser.role);
    }
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem('syncspace-authenticated');
    setUser(null);
    setStatus('anonymous');
  }, []);

  // On load, validate any stored token against the backend rather than
  // trusting a stale cached role.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('anonymous');
      return;
    }
    authApi
      .me()
      .then(({ user: freshUser }) => applySession(null, freshUser))
      .catch(() => clearSession());
  }, [applySession, clearSession]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    window.localStorage.setItem('syncspace-authenticated', 'true');
    applySession(data.token, data.user);
    return data.user;
  }, [applySession]);

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await authApi.googleLogin(credential);
    window.localStorage.setItem('syncspace-authenticated', 'true');
    applySession(data.token, data.user);
    return data.user;
  }, [applySession]);

  const register = useCallback(async (name, email, password, role) => {
    const data = await authApi.signup(name, email, password, role);
    window.localStorage.setItem('syncspace-authenticated', 'true');
    applySession(data.token, data.user);
    return data.user;
  }, [applySession]);

  const updateProfile = useCallback(async (payload) => {
    const data = await authApi.updateProfile(payload);
    applySession(null, data.user);
    return data.user;
  }, [applySession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, role: user?.role || null, status, isAuthenticated: status === 'authenticated', login, loginWithGoogle, register, updateProfile, logout }),
    [user, status, login, loginWithGoogle, register, updateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
