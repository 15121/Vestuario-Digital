// ============================================================
// PRONÓSTICO DEL RESTO DEL DÍA (OpenWeather)
// ============================================================
//
// Ubicación: services/forecastService.js
//
// El clima ACTUAL sale de services/weatherService.js.
// Este archivo pide el pronóstico cada 3 horas a la MISMA API
// (OpenWeather, misma clave) para sugerir "capas" en la
// recomendación climática cuando el día cambia mucho
// (por ejemplo: "a las 21 h baja a 9°C").
// ============================================================

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

const FORECAST_URL =
  'https://api.openweathermap.org/data/2.5/forecast';

const cache = new Map();


// ============================================================
// PETICIÓN
// ============================================================

const fetchJson = async (url) => {
  if (cache.has(url)) {
    return cache.get(url);
  }

  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error('No se pudo conectar. Revisá tu conexión a internet.');
  }

  if (!response.ok) {
    throw new Error('No se pudo obtener el pronóstico en este momento.');
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
};


// ============================================================
// PRONÓSTICO CADA 3 HORAS
// ============================================================

const fetchForecast = async (latitude, longitude) => {
  if (!API_KEY) {
    throw new Error('Falta configurar EXPO_PUBLIC_OPENWEATHER_API_KEY en el archivo .env.');
  }

  const url =
    `${FORECAST_URL}?lat=${latitude}&lon=${longitude}` +
    `&units=metric&lang=es&appid=${API_KEY}`;

  const data = await fetchJson(url);

  if (!Array.isArray(data?.list)) {
    throw new Error('No se pudo obtener el pronóstico en este momento.');
  }

  const offsetMs = Number(data.city?.timezone || 0) * 1000;
  const localNow = new Date(Date.now() + offsetMs).toISOString();

  // Pasamos cada horario a la hora local del lugar.
  return data.list.map((entry) => {
    const local = new Date(entry.dt * 1000 + offsetMs).toISOString();

    return {
      date: local.slice(0, 10),
      hour: Number(local.slice(11, 13)),
      temp: entry.main?.temp,
      feelsLike: entry.main?.feels_like,
      rainProb: Math.round(Number(entry.pop || 0) * 100),
      localNow,
    };
  });
};


/**
 * Pronóstico del resto del día de hoy, en bloques de 3 horas.
 * Devuelve [{ hour, temp, feelsLike, rainProb }].
 */
export const getRestOfDayForecast = async (latitude, longitude) => {
  const hasCoord = (v) =>
    v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

  if (!hasCoord(latitude) || !hasCoord(longitude)) {
    return [];
  }

  const list = await fetchForecast(latitude, longitude);
  const today = list[0]?.localNow?.slice(0, 10);

  // La lista empieza en el próximo bloque; repetimos el primero
  // al principio para que la comparación sea "desde ahora".
  const todayItems = list.filter((h) => h.date === today);

  return todayItems.length > 0 ? [todayItems[0], ...todayItems] : [];
};
