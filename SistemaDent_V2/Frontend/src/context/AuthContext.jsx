import { useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './auth-context-base';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  // Si no hay token guardado, no hay nada que verificar: arranca sin loading.
  const [loading, setLoading] = useState(() => !!localStorage.getItem('access_token'));

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    api.get('/usuarios/me')
      .then(({ data }) => setUser(data))
      .catch((err) => {
        // Solo cerramos la sesión si el token es inválido/expiró (401).
        // Un error de red o el backend caído no debe desloguear al usuario.
        if (err.response?.status === 401) {
          localStorage.clear();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/usuarios/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const me = await api.get('/usuarios/me');
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}