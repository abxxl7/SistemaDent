const FALLBACK = 'Ocurrió un error inesperado. Intentá de nuevo.';
const SIN_CONEXION =
  'No se pudo conectar con el servidor. Verificá tu conexión WiFi y que la IP de EXPO_PUBLIC_API_URL sea la de la PC.';

// Devuelve el mensaje del backend tal cual (detail). Los 422 de validación llegan como lista de { msg }.
export function getErrorMessage(err) {
  if (err?.response) {
    const detail = err.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const msgs = detail.map((d) => (d?.msg ?? '').replace(/^Value error, /, '')).filter(Boolean);
      if (msgs.length) return msgs.join('\n');
    }
    return FALLBACK;
  }
  if (err?.request || err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') return SIN_CONEXION;
  return FALLBACK;
}

// Reglas de negocio (conflicto, límite, fecha pasada, duplicado...) = advertencia ámbar; el resto = error rojo
export function getErrorTone(err) {
  return [400, 403, 404, 422].includes(err?.response?.status) ? 'warning' : 'error';
}

export function parseError(err) {
  return { message: getErrorMessage(err), tone: getErrorTone(err) };
}
