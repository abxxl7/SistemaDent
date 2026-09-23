import { useState, useEffect, useMemo, useCallback } from 'react';
import api, { setSessionExpiredHandler } from '../services/api';
import { getRefreshToken, saveTokens, clearTokens } from '../services/tokenStorage';
import { AuthContext } from './auth-context-base';

export function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  // Al abrir la app se revisa si quedó una sesión guardada
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No hay /app/me: si hay sesión guardada se confía en ella; si expiró, el primer request
    // dispara el refresh y, si este falla, el interceptor cierra la sesión.
    getRefreshToken()
      .then((token) => setIsSignedIn(!!token))
      .catch(() => setIsSignedIn(false))
      .finally(() => setLoading(false));

    setSessionExpiredHandler(() => setIsSignedIn(false));
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (documento, password) => {
    const { data } = await api.post('/app/login', { documento, password });
    await saveTokens(data);
    setIsSignedIn(true);
  }, []);

  const registro = useCallback(async (datos) => {
    const { data } = await api.post('/app/registro', datos);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setIsSignedIn(false);
  }, []);

  const value = useMemo(
    () => ({ isSignedIn, loading, login, registro, logout }),
    [isSignedIn, loading, login, registro, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
