import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, profile: null, hasPass: false, expiresAt: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setState({ user: me.user, profile: me.profile || null, hasPass: me.hasPass, expiresAt: me.expiresAt, loading: false });
      return me;
    } catch {
      setState((s) => ({ ...s, loading: false }));
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const verifyEmail = useCallback(async (email, code) => {
    const res = await api.verifyEmail(email, code);
    await refresh();
    return res;
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    await refresh();
    return res;
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.logout();
    setState({ user: null, profile: null, hasPass: false, expiresAt: null, loading: false });
  }, []);

  const value = {
    ...state,
    register: api.register,
    verifyEmail,
    login,
    resendCode: api.resendCode,
    logout,
    refresh,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
