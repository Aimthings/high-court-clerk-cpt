import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, hasPass: false, expiresAt: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setState({ user: me.user, hasPass: me.hasPass, expiresAt: me.expiresAt, loading: false });
      return me;
    } catch {
      setState((s) => ({ ...s, loading: false }));
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const verifyOtp = useCallback(async (phone, code) => {
    const res = await api.verifyOtp(phone, code);
    setState({ user: res.user, hasPass: res.hasPass, expiresAt: res.expiresAt, loading: false });
    return res;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setState({ user: null, hasPass: false, expiresAt: null, loading: false });
  }, []);

  const value = {
    ...state,
    sendOtp: api.sendOtp,
    verifyOtp,
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
