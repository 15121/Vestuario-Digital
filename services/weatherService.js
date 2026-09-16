// ============================================================
// SERVICIO DE CLIMA (OpenWeatherMap)
// ============================================================

const API_KEY = '4fef9b7a6ae73acafddd96e31a199cfc';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Obtiene la información climática de una ciudad ingresada.
 *
 * @param {string} city - Nombre de la ciudad.
 * @returns {Promise<Object>} Datos climáticos procesados.
 */
export const getWeatherByCity = async (city) => {
  if (!city || city.trim() === '') {
    throw new Error('Debes ingresar el nombre de una ciudad.');
  }

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(
      city.trim()
    )}&units=metric&lang=es&appid=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    // Ciudad inexistente
    if (response.status === 404) {
      throw new Error(
        'Ciudad no encontrada. Verifica el nombre ingresado.'
      );
    }

    // Otros errores de la API
    if (!response.ok) {
      throw new Error(
        'No se pudo obtener el clima en este momento.'
      );
    }

    // ========================================================
    // DATOS CLIMÁTICOS PROCESADOS
    // ========================================================
    return {
      // Temperatura actual
      temp: Math.round(data.main.temp),

      // Sensación térmica
      // Necesaria para reproducir el mockup:
      // "Sensación térmica 17°C"
      feelsLike: Math.round(data.main.feels_like),

      // Humedad
      humidity: data.main.humidity,

      // Grupo principal del clima
      // Ej:
      // Rain, Snow, Thunderstorm, Clear, Clouds
      conditionGroup: data.weather[0].main,

      // Descripción en español
      // Ej:
      // "lluvia ligera", "parcialmente nublado", etc.
      conditionDescription: data.weather[0].description,

      // Código del ícono de OpenWeather
      iconCode: data.weather[0].icon,

      // Ciudad + país
      city: `${data.name}, ${data.sys.country}`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retorna la regla de recomendación contemplando todos los climas.
 *
 * @param {number} temp - Temperatura en °C.
 * @param {string} conditionGroup - Grupo principal del clima.
 * @param {number} humidity - Porcentaje de humedad.
 * @returns {string} Sugerencia de vestimenta.
 */
export const getOutfitRecommendation = (
  temp,
  conditionGroup,
  humidity
) => {
  const isRaining =
    conditionGroup === 'Rain' ||
    conditionGroup === 'Drizzle' ||
    conditionGroup === 'Thunderstorm';

  const isSnowing = conditionGroup === 'Snow';

  const isHumid = humidity >= 75;

  // ==========================================================
  // 1. LLUVIA / TORMENTA
  // ==========================================================
  if (isRaining) {
    if (temp <= 15) {
      return 'Lluvia y frío: Te sugerimos piloto o campera impermeable, calzado resistente al agua, abrigo y paraguas.';
    }

    return 'Lluvia cálida/templada: Lleva prendas livianas de rápido secado, impermeables ligeros o piloto y paraguas.';
  }

  // ==========================================================
  // 2. NIEVE
  // ==========================================================
  if (isSnowing) {
    return 'Clima con nieve: Usa abrigo pesado o campera térmica, ropa de abrigo por capas, guantes, gorro y botas impermeables.';
  }

  // ==========================================================
  // 3. CALOR + HUMEDAD ALTA
  // ==========================================================
  if (temp > 22 && isHumid) {
    return 'Calor y humedad alta: Optá por ropa muy liviana y holgada de algodón o lino, colores claros y calzado fresco para evitar agobiarte.';
  }

  // ==========================================================
  // 4. CLIMA FRÍO
  // ==========================================================
  if (temp <= 12) {
    return 'Clima frío: Te sugerimos usar abrigo pesado, campera, abrigo o saco térmico y bufanda.';
  }

  // ==========================================================
  // 5. CLIMA TEMPLADO / MODERADO
  // ==========================================================
  if (temp > 12 && temp <= 22) {
    return 'Clima templado: Ideal para llevar buzo, camisas de manga larga, sweater ligero o campera liviana.';
  }

  // ==========================================================
  // 6. CALOR SECO / NORMAL
  // ==========================================================
  return 'Clima cálido: Te recomendamos usar remera, musculosa, shorts, vestidos o ropa liviana de algodón.';
};