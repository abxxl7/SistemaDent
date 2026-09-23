import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Rutas donde un 401 es una respuesta esperada (credenciales incorrectas) y NO debe disparar el refresh
const RUTAS_SIN_REFRESH = ['/app/login', '/app/registro', '/app/refresh'];

// El AuthProvider registra acá qué hacer cuando la sesión ya no se puede renovar
let onSessionExpired = null;
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

// Adjunta el access token a cada request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Un solo refresh en vuelo: si varias requests reciben 401 a la vez, comparten el mismo intento
let refreshPromise = null;
const refrescarTokens = () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh_token = await getRefreshToken();
      if (!refresh_token) throw new Error('Sin refresh token');
      const { data } = await axios.post(`${API_URL}/app/refresh`, { refresh_token }, { timeout: 15000 });
      await saveTokens(data);
      return data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// Si el access token expiró, intenta renovarlo con el refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url ?? '';
    const esRutaSinRefresh = RUTAS_SIN_REFRESH.some((ruta) => url.startsWith(ruta));

    if (error.response?.status === 401 && original && !original._retry && !esRutaSinRefresh) {
      original._retry = true;
      try {
        const nuevoAccess = await refrescarTokens();
        original.headers.Authorization = `Bearer ${nuevoAccess}`;
        return api(original);
      } catch (refreshError) {
        // Sin conexión (no hubo respuesta del servidor): no se cierra la sesión, se propaga el error de red.
        if (refreshError.request && !refreshError.response) {
          return Promise.reject(refreshError);
        }
        // Refresh rechazado o inexistente: limpiar todo y volver a Login
        await clearTokens();
        if (onSessionExpired) onSessionExpired();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
