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
// (por ejemplo: "a las 21 h baja a 9°C") y para armar el clima
// de MAÑANA ("¿Qué me pongo mañana?").
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
      tempMin: entry.main?.temp_min,
      tempMax: entry.main?.temp_max,
      feelsLike: entry.main?.feels_like,
      humidity: entry.main?.humidity,
      windSpeedMs: Number(entry.wind?.speed || 0),
      group: entry.weather?.[0]?.main || 'Clouds',
      description: entry.weather?.[0]?.description || '',
      icon: entry.weather?.[0]?.icon || '02d',
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



// ============================================================
// CLIMA DE MAÑANA
// ============================================================
//
// Resume los bloques de 3 horas de mañana en un objeto con la
// MISMA forma que getWeatherByCity (temp, feelsLike,
// conditionGroup, humidity, windSpeedMs, isWindy), así el motor
// de recomendación lo usa igual que el clima de hoy.
//
// Se toma como referencia el horario de día (9 a 21 h), que es
// cuando la persona va a estar con esa ropa puesta.

const WINDY_THRESHOLD_MS = 8;

// Del más "importante" al menos importante para vestirse.
const GROUP_PRIORITY = ['Thunderstorm', 'Snow', 'Rain', 'Drizzle'];

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const average = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;

/**
 * @returns {Promise<{ date, weather, hours, min, max } | null>}
 */
export const getTomorrowForecast = async (latitude, longitude) => {
  const hasCoord = (v) =>
    v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

  if (!hasCoord(latitude) || !hasCoord(longitude)) {
    return null;
  }

  const list = await fetchForecast(latitude, longitude);

  const today = list[0]?.localNow?.slice(0, 10);

  if (!today) {
    return null;
  }

  const [y, m, d] = today.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const tomorrow = next.toISOString().slice(0, 10);

  const all = list.filter((h) => h.date === tomorrow);

  if (all.length === 0) {
    return null;
  }

  const daytime = all.filter((h) => h.hour >= 9 && h.hour <= 21);
  const reference = daytime.length > 0 ? daytime : all;

  // Condición del día: la más importante que aparezca en al menos
  // 2 bloques (o 1 con mucha probabilidad), si no la más común.
  const counts = {};
  reference.forEach((h) => {
    counts[h.group] = (counts[h.group] || 0) + 1;
  });

  const important = GROUP_PRIORITY.find((group) =>
    reference.some(
      (h) => h.group === group && (counts[group] >= 2 || h.rainProb >= 60)
    )
  );

  const conditionGroup =
    important ||
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  const descriptionEntry =
    reference.find((h) => h.group === conditionGroup) || reference[0];

  const windSpeedMs = Math.max(...reference.map((h) => h.windSpeedMs));
  const feelsLike = average(reference.map((h) => Number(h.feelsLike)));
  const temp = average(reference.map((h) => Number(h.temp)));

  const weather = {
    temp: Math.round(temp),
    feelsLike: Math.round(feelsLike),
    humidity: Math.round(average(reference.map((h) => Number(h.humidity || 0)))),
    conditionGroup,
    conditionDescription: descriptionEntry.description,
    displayDescription: capitalize(descriptionEntry.description),
    iconCode: descriptionEntry.icon.replace('n', 'd'),
    windSpeedMs,
    windSpeedKmh: Math.round(windSpeedMs * 3.6),
    isWindy: windSpeedMs >= WINDY_THRESHOLD_MS,
    latitude,
    longitude,
  };

  // Para las "capas": primer bloque de la mañana como punto de
  // partida y después el resto del día.
  const hours = [reference[0], ...reference];

  return {
    date: tomorrow,
    weather,
    hours,
    min: Math.round(Math.min(...all.map((h) => Number(h.tempMin ?? h.temp)))),
    max: Math.round(Math.max(...all.map((h) => Number(h.tempMax ?? h.temp)))),
    maxRainProb: Math.max(...all.map((h) => h.rainProb)),
  };
};
