// services/api.js
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TIMEOUT_MS = 30000;

// El token vive solo en memoria (se pierde al recargar la web, igual que la sesión).
let authToken = null;

// Callback global que se ejecuta cuando el servidor responde 401
// estando logueado (token vencido o inválido, cuenta suspendida, etc.).
// Lo registra el navegador principal (ver MainTabNavigator) y hace logout.
let unauthorizedHandler = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const getAuthToken = () => authToken;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
};

// true si el error vino de una sesión vencida.
// Sirve para NO convertirlo en "lista vacía" en los catch de database.js.
// (Un 401 de login con credenciales malas NO cuenta: ahí no había token.)
export const isSessionExpiredError = (error) => error?.sessionExpired === true;

export const api = async (path, options = {}) => {
  const { headers: extraHeaders, body, ...rest } = options;

  // Token con el que sale ESTA request. Se compara después para no
  // desloguear por error si el usuario ya volvió a iniciar sesión.
  const sentToken = authToken;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // la respuesta no era JSON
  }

  if (!res.ok) {
    console.log('API ERROR:', path, res.status, data?.error || '');

    const error = new Error(
      data?.error || data?.message || `HTTP_${res.status}`
    );
    error.status = res.status;

    // Sesión vencida: solo si la request iba con token.
    if (res.status === 401 && sentToken) {
      error.sessionExpired = true;

      // Varias requests en paralelo pueden fallar a la vez:
      // solo la primera dispara el logout (después authToken ya es null).
      if (authToken === sentToken) {
        authToken = null;

        try {
          unauthorizedHandler?.();
        } catch (handlerError) {
          console.log('Error en unauthorizedHandler:', handlerError);
        }
      }
    }

    throw error;
  }

  return data;
};
