import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokenStore } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
  }, []);

  // Restore session on page load
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then((d) => setAdmin(d.admin))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = async (email, password) => {
    const { token, admin } = await authApi.login({ email, password });
    tokenStore.set(token);
    setAdmin(admin);
  };

  return <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>;
}
