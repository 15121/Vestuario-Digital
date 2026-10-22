// ============================================================
// PRONÓSTICO EXTENDIDO (Open-Meteo)
// ============================================================
//
// Ubicación: services/forecastService.js
//
// El clima ACTUAL sigue saliendo de OpenWeather
// (services/weatherService.js). Este archivo agrega lo que
// OpenWeather gratis no da:
//
//   1. Pronóstico por hora del resto del día
//      → para sugerir "capas" cuando el día cambia mucho.
//   2. Pronóstico por día para las fechas de un viaje
//      → para el clima del destino en el modo maleta.
//
// Open-Meteo es gratuito, no necesita API key y permite
// pedirlo desde el navegador (versión web).
//
// Límites del pronóstico:
//   - Pronóstico real: hasta 16 días hacia adelante.
//   - Más allá de eso, usamos el clima que hubo en esas mismas
//     fechas el año pasado y lo marcamos como "estimado".
// ============================================================

const GEOCODING_URL =
  'https://geocoding-api.open-meteo.com/v1/search';

const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast';

const ARCHIVE_URL =
  'https://archive-api.open-meteo.com/v1/archive';

// Días hacia adelante que cubre el pronóstico real.
const FORECAST_MAX_DAYS = 15;

// Días hacia atrás que el endpoint de pronóstico acepta.
const FORECAST_PAST_DAYS = 90;

// Máximo de días de viaje que consultamos.
const MAX_TRIP_DAYS = 60;

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
].join(',');


// ============================================================
// FECHAS (siempre "YYYY-MM-DD", sin horas)
// ============================================================

const pad2 = (n) => String(n).padStart(2, '0');

const toDateString = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateString = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));

  if (!match) {
    return null;
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
};

const addDays = (dateString, days) => {
  const date = parseDateString(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

const minDate = (a, b) => (a < b ? a : b);
const maxDate = (a, b) => (a > b ? a : b);

// Misma fecha, un año antes (el 29/02 pasa a 28/02).
const sameDateLastYear = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const day = m === 2 && d === 29 ? 28 : d;
  return `${y - 1}-${pad2(m)}-${pad2(day)}`;
};

const nextYearDate = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return `${y + 1}-${pad2(m)}-${pad2(d)}`;
};


// ============================================================
// CÓDIGOS DE CLIMA (WMO) → texto e ícono
// ============================================================

export const describeWeatherCode = (code) => {
  const c = Number(code);

  if (c === 0) return { label: 'Despejado', icon: 'sunny-outline', group: 'Clear' };
  if (c <= 2) return { label: 'Parcialmente nublado', icon: 'partly-sunny-outline', group: 'Clouds' };
  if (c === 3) return { label: 'Nublado', icon: 'cloud-outline', group: 'Clouds' };
  if (c === 45 || c === 48) return { label: 'Niebla', icon: 'cloud-outline', group: 'Fog' };
  if (c >= 51 && c <= 57) return { label: 'Llovizna', icon: 'rainy-outline', group: 'Drizzle' };
  if (c >= 61 && c <= 67) return { label: 'Lluvia', icon: 'rainy-outline', group: 'Rain' };
  if (c >= 71 && c <= 77) return { label: 'Nieve', icon: 'snow-outline', group: 'Snow' };
  if (c >= 80 && c <= 82) return { label: 'Chaparrones', icon: 'rainy-outline', group: 'Rain' };
  if (c === 85 || c === 86) return { label: 'Nieve', icon: 'snow-outline', group: 'Snow' };
  if (c >= 95) return { label: 'Tormenta', icon: 'thunderstorm-outline', group: 'Thunderstorm' };

  return { label: 'Variable', icon: 'partly-sunny-outline', group: 'Clouds' };
};


// ============================================================
// PETICIONES
// ============================================================

const cache = new Map();

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
// BUSCAR CIUDAD → coordenadas
// ============================================================
//
// Acepta "Bariloche", "Córdoba, Argentina" o "Buenos Aires, AR"
// (como devuelve OpenWeather).

export const geocodeCity = async (query) => {
  const text = String(query || '').trim();

  if (!text) {
    throw new Error('Ingresá un destino.');
  }

  const [namePart, ...rest] = text.split(',');
  const hint = rest.join(',').trim().toLowerCase();

  const url =
    `${GEOCODING_URL}?name=${encodeURIComponent(namePart.trim())}` +
    '&count=10&language=es&format=json';

  const data = await fetchJson(url);
  const results = Array.isArray(data?.results) ? data.results : [];

  if (results.length === 0) {
    throw new Error('No encontramos ese destino. Probá con el nombre de la ciudad.');
  }

  // Si vino un país o provincia después de la coma, lo usamos
  // para elegir el resultado correcto.
  const match = hint
    ? results.find((r) =>
        [r.country_code, r.country, r.admin1]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase() === hint)
      )
    : null;

  const place = match || results[0];

  return {
    name: place.name,
    country: place.country || '',
    region: place.admin1 || '',
    latitude: place.latitude,
    longitude: place.longitude,
  };
};


// ============================================================
// 1) PRONÓSTICO DEL RESTO DEL DÍA (para las "capas")
// ============================================================
//
// Devuelve las horas que quedan hasta la medianoche del lugar:
//   [{ hour: 18, temp, feelsLike, rainProb, code }]

export const getRestOfDayForecast = async (latitude, longitude) => {
  const hasCoord = (v) =>
    v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

  if (!hasCoord(latitude) || !hasCoord(longitude)) {
    return [];
  }

  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    '&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code' +
    '&forecast_days=1&timezone=auto';

  const data = await fetchJson(url);
  const hourly = data?.hourly;

  if (!hourly || !Array.isArray(hourly.time)) {
    return [];
  }

  // Hora actual en la zona horaria del lugar consultado.
  const offsetMs = Number(data.utc_offset_seconds || 0) * 1000;
  const localNow = new Date(Date.now() + offsetMs).toISOString().slice(0, 13);

  return hourly.time
    .map((time, i) => ({
      time,
      hour: Number(time.slice(11, 13)),
      temp: hourly.temperature_2m?.[i],
      feelsLike: hourly.apparent_temperature?.[i],
      rainProb: hourly.precipitation_probability?.[i],
      code: hourly.weather_code?.[i],
    }))
    .filter((h) => h.time.slice(0, 13) >= localNow && Number.isFinite(h.feelsLike));
};


// ============================================================
// 2) PRONÓSTICO DE UN VIAJE (para el modo maleta)
// ============================================================

const normalizeDaily = (daily, estimated, mapDate = (d) => d) => {
  if (!daily || !Array.isArray(daily.time)) {
    return [];
  }

  return daily.time.map((time, i) => {
    const code = daily.weather_code?.[i];
    const rainMm = Number(daily.precipitation_sum?.[i] || 0);

    return {
      date: mapDate(time),
      max: daily.temperature_2m_max?.[i],
      min: daily.temperature_2m_min?.[i],
      feelsMax: daily.apparent_temperature_max?.[i],
      feelsMin: daily.apparent_temperature_min?.[i],
      rainMm,
      rainy: rainMm >= 1 || ['Rain', 'Drizzle', 'Thunderstorm'].includes(describeWeatherCode(code).group),
      snowy: describeWeatherCode(code).group === 'Snow',
      code,
      ...describeWeatherCode(code),
      estimated,
    };
  });
};

const fetchDaily = async (baseUrl, place, start, end) => {
  const url =
    `${baseUrl}?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&daily=${DAILY_VARS}&start_date=${start}&end_date=${end}&timezone=auto`;

  const data = await fetchJson(url);
  return data?.daily;
};

/**
 * Clima de un destino para las fechas de un viaje.
 *
 * @param {string} destination - Ciudad de destino.
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 * @returns {Promise<{ place, days, summary }>}
 */
export const getTripForecast = async (destination, startDate, endDate) => {
  const start = String(startDate || '').slice(0, 10);
  let end = String(endDate || startDate || '').slice(0, 10);

  if (!parseDateString(start) || !parseDateString(end)) {
    throw new Error('Elegí las fechas del viaje para ver el clima.');
  }

  if (end < start) {
    end = start;
  }

  if (addDays(start, MAX_TRIP_DAYS - 1) < end) {
    end = addDays(start, MAX_TRIP_DAYS - 1);
  }

  const place = await geocodeCity(destination);

  const today = toDateString(new Date());
  const forecastFrom = addDays(today, -FORECAST_PAST_DAYS);
  const forecastTo = addDays(today, FORECAST_MAX_DAYS);

  const requests = [];

  // a) Fechas muy pasadas → clima real que hubo.
  if (start < forecastFrom) {
    requests.push(
      fetchDaily(ARCHIVE_URL, place, start, minDate(end, addDays(forecastFrom, -1)))
        .then((daily) => normalizeDaily(daily, false))
    );
  }

  // b) Fechas dentro del pronóstico → pronóstico real.
  const fStart = maxDate(start, forecastFrom);
  const fEnd = minDate(end, forecastTo);

  if (fStart <= fEnd) {
    requests.push(
      fetchDaily(FORECAST_URL, place, fStart, fEnd)
        .then((daily) => normalizeDaily(daily, false))
    );
  }

  // c) Fechas lejanas → mismas fechas del año pasado (estimado).
  const eStart = maxDate(start, addDays(forecastTo, 1));

  if (eStart <= end) {
    requests.push(
      fetchDaily(ARCHIVE_URL, place, sameDateLastYear(eStart), sameDateLastYear(end))
        .then((daily) => normalizeDaily(daily, true, nextYearDate))
    );
  }

  const days = (await Promise.all(requests))
    .flat()
    .filter((d) => Number.isFinite(d.max) && Number.isFinite(d.min))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (days.length === 0) {
    throw new Error('No hay datos del clima para esas fechas.');
  }

  return { place, days, summary: summarizeDays(days) };
};


// ============================================================
// RESUMEN DE VARIOS DÍAS
// ============================================================

export const summarizeDays = (days) => {
  const list = Array.isArray(days) ? days : [];

  const feelsMins = list.map((d) => (Number.isFinite(d.feelsMin) ? d.feelsMin : d.min));
  const feelsMaxs = list.map((d) => (Number.isFinite(d.feelsMax) ? d.feelsMax : d.max));

  return {
    days: list.length,
    min: Math.round(Math.min(...list.map((d) => d.min))),
    max: Math.round(Math.max(...list.map((d) => d.max))),
    feelsMin: Math.round(Math.min(...feelsMins)),
    feelsMax: Math.round(Math.max(...feelsMaxs)),
    // Promedio de "temperatura del día" que se siente.
    feelsAvg: Math.round(
      list.reduce((sum, d, i) => sum + (feelsMins[i] + feelsMaxs[i]) / 2, 0) /
        Math.max(list.length, 1)
    ),
    rainyDays: list.filter((d) => d.rainy).length,
    snowyDays: list.filter((d) => d.snowy).length,
    estimated: list.some((d) => d.estimated),
  };
};
