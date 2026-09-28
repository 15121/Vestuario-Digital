// ============================================================
// SERVICIO DE CLIMA - OPENWEATHERMAP
// ============================================================

const API_KEY = '4fef9b7a6ae73acafddd96e31a199cfc';

const BASE_URL =
  'https://api.openweathermap.org/data/2.5/weather';


// ============================================================
// CONSTANTES
// ============================================================

// OpenWeather entrega la velocidad del viento en metros
// por segundo cuando utilizamos units=metric.
//
// 8 m/s ≈ 29 km/h.
//
// A partir de este valor consideramos que el viento
// es suficientemente relevante para mostrarlo visualmente.
const WINDY_THRESHOLD_MS = 8;


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Capitaliza la primera letra de un texto.
 *
 * @param {string} value
 * @returns {string}
 */
const capitalizeFirstLetter = (value) => {
  if (!value) {
    return '';
  }

  const text = String(value);

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
};


/**
 * Determina si una velocidad de viento es suficientemente
 * relevante como para considerarla "ventosa".
 *
 * @param {number} windSpeed
 * @returns {boolean}
 */
const isWindyWeather = (windSpeed) => {
  const numericWindSpeed = Number(windSpeed || 0);

  return numericWindSpeed >= WINDY_THRESHOLD_MS;
};


/**
 * Convierte metros por segundo a kilómetros por hora.
 *
 * @param {number} metersPerSecond
 * @returns {number}
 */
const metersPerSecondToKilometersPerHour = (
  metersPerSecond
) => {
  const value = Number(metersPerSecond || 0);

  return Math.round(value * 3.6);
};


/**
 * Determina qué tipo de icono debería utilizar la pantalla.
 *
 * OpenWeather no proporciona un iconCode específico
 * para representar viento.
 *
 * Por eso:
 *
 * - Condición normal → icono de OpenWeather.
 * - Viento relevante → icono propio de viento.
 *
 * En tormenta mantenemos el icono de tormenta para no
 * reemplazar información climática más importante.
 *
 * @param {string} conditionGroup
 * @param {boolean} isWindy
 * @returns {'openweather'|'wind'}
 */
const getWeatherIconType = (
  conditionGroup,
  isWindy
) => {
  if (
    isWindy &&
    conditionGroup !== 'Thunderstorm'
  ) {
    return 'wind';
  }

  return 'openweather';
};


/**
 * Determina la descripción que utilizará la pantalla.
 *
 * La descripción original de OpenWeather se conserva.
 *
 * @param {string} conditionDescription
 * @param {boolean} isWindy
 * @returns {string}
 */
const getWeatherDisplayDescription = (
  conditionDescription,
  isWindy
) => {
  const originalDescription =
    capitalizeFirstLetter(
      conditionDescription
    );

  if (!isWindy) {
    return originalDescription;
  }

  if (!originalDescription) {
    return 'Viento';
  }

  return originalDescription;
};


// ============================================================
// OBTENER CLIMA POR CIUDAD
// ============================================================

/**
 * Obtiene la información climática actual de una ciudad.
 *
 * @param {string} city - Nombre de la ciudad.
 * @returns {Promise<Object>} Datos climáticos procesados.
 */
export const getWeatherByCity = async (city) => {
  if (!city || city.trim() === '') {
    throw new Error(
      'Debes ingresar el nombre de una ciudad.'
    );
  }

  try {
    const cleanCity = city.trim();

    const url =
      `${BASE_URL}?q=${encodeURIComponent(
        cleanCity
      )}&units=metric&lang=es&appid=${API_KEY}`;

    const response = await fetch(url);

    const data = await response.json();


    // ========================================================
    // CIUDAD NO ENCONTRADA
    // ========================================================

    if (response.status === 404) {
      throw new Error(
        'Ciudad no encontrada. Verifica el nombre ingresado.'
      );
    }


    // ========================================================
    // OTROS ERRORES DE LA API
    // ========================================================

    if (!response.ok) {
      throw new Error(
        'No se pudo obtener el clima en este momento.'
      );
    }


    // ========================================================
    // VALIDACIÓN DE LA RESPUESTA
    // ========================================================

    if (
      !data ||
      !data.main ||
      !Array.isArray(data.weather) ||
      !data.weather[0]
    ) {
      throw new Error(
        'La información climática recibida no es válida.'
      );
    }


    // ========================================================
    // INFORMACIÓN PRINCIPAL
    // ========================================================

    const weatherData =
      data.weather[0];

    const conditionGroup =
      weatherData.main || '';

    const conditionDescription =
      weatherData.description || '';

    const iconCode =
      weatherData.icon || '01d';


    // ========================================================
    // TEMPERATURA
    // ========================================================

    const temperature =
      Number(data.main.temp);

    const feelsLike =
      Number(data.main.feels_like);

    const humidity =
      Number(data.main.humidity);


    // ========================================================
    // INFORMACIÓN DEL VIENTO
    // ========================================================

    // Velocidad actual del viento en m/s.
    const windSpeedMs =
      Number(data.wind?.speed || 0);

    // Velocidad actual convertida a km/h.
    const windSpeedKmh =
      metersPerSecondToKilometersPerHour(
        windSpeedMs
      );

    // Dirección del viento en grados.
    const windDegree =
      data.wind?.deg ?? null;

    // Ráfaga de viento en m/s.
    const windGustMs =
      data.wind?.gust != null
        ? Number(data.wind.gust)
        : null;

    // Ráfaga convertida a km/h.
    const windGustKmh =
      windGustMs != null
        ? metersPerSecondToKilometersPerHour(
            windGustMs
          )
        : null;

    // Determinamos si el viento es suficientemente
    // relevante para modificar visualmente la tarjeta.
    const isWindy =
      isWindyWeather(windSpeedMs);


    // ========================================================
    // TIPO DE ICONO
    // ========================================================

    const weatherIconType =
      getWeatherIconType(
        conditionGroup,
        isWindy
      );


    // ========================================================
    // DESCRIPCIÓN PARA LA PANTALLA
    // ========================================================

    const displayDescription =
      getWeatherDisplayDescription(
        conditionDescription,
        isWindy
      );


    // ========================================================
    // RESULTADO FINAL
    // ========================================================

    return {

      // ------------------------------------------------------
      // TEMPERATURA
      // ------------------------------------------------------

      temp:
        Math.round(temperature),

      feelsLike:
        Math.round(feelsLike),


      // ------------------------------------------------------
      // HUMEDAD
      // ------------------------------------------------------

      humidity,


      // ------------------------------------------------------
      // CONDICIÓN CLIMÁTICA
      // ------------------------------------------------------

      conditionGroup,

      conditionDescription,

      displayDescription,


      // ------------------------------------------------------
      // ICONO DE OPENWEATHER
      // ------------------------------------------------------

      iconCode,


      // ------------------------------------------------------
      // TIPO DE ICONO
      //
      // "openweather" → icono de OpenWeather
      // "wind"        → icono propio de viento
      // ------------------------------------------------------

      weatherIconType,


      // ------------------------------------------------------
      // VIENTO
      // ------------------------------------------------------

      windSpeedMs,

      windSpeedKmh,

      windDegree,

      windGustMs,

      windGustKmh,

      isWindy,


      // ------------------------------------------------------
      // CIUDAD
      // ------------------------------------------------------

      city:
        `${data.name}, ${data.sys.country}`,
    };

  } catch (error) {
    throw error;
  }
};


// ============================================================
// RECOMENDACIÓN GENERAL DE VESTIMENTA
// ============================================================

/**
 * Retorna una recomendación general de vestimenta
 * contemplando diferentes condiciones climáticas.
 *
 * IMPORTANTE:
 *
 * Esta función devuelve solamente el TEXTO general
 * de recomendación.
 *
 * La selección de prendas concretas del armario se
 * realiza posteriormente en weatherRecScreen.js.
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
  const temperature =
    Number(temp);

  const humidityValue =
    Number(humidity);


  // ==========================================================
  // CONDICIONES CLIMÁTICAS
  // ==========================================================

  const isRaining =
    conditionGroup === 'Rain' ||
    conditionGroup === 'Drizzle' ||
    conditionGroup === 'Thunderstorm';

  const isSnowing =
    conditionGroup === 'Snow';

  const isHumid =
    humidityValue >= 75;


  // ==========================================================
  // 1. LLUVIA / TORMENTA
  // ==========================================================

  if (isRaining) {

    if (temperature <= 15) {
      return (
        'Lluvia y frío: Te sugerimos piloto o campera ' +
        'impermeable, calzado resistente al agua, abrigo ' +
        'y paraguas.'
      );
    }

    return (
      'Lluvia cálida/templada: Lleva prendas livianas ' +
      'de rápido secado, impermeables ligeros o piloto ' +
      'y paraguas.'
    );
  }


  // ==========================================================
  // 2. NIEVE
  // ==========================================================

  if (isSnowing) {
    return (
      'Clima con nieve: Usa abrigo pesado o campera ' +
      'térmica, ropa de abrigo por capas, guantes, gorro ' +
      'y botas impermeables.'
    );
  }


  // ==========================================================
  // 3. CALOR + HUMEDAD ALTA
  // ==========================================================

  if (
    temperature > 22 &&
    isHumid
  ) {
    return (
      'Calor y humedad alta: Optá por ropa muy liviana ' +
      'y holgada de algodón o lino, colores claros y ' +
      'calzado fresco para evitar agobiarte.'
    );
  }


  // ==========================================================
  // 4. CLIMA FRÍO
  // ==========================================================

  if (temperature <= 12) {
    return (
      'Clima frío: Te sugerimos usar abrigo pesado, ' +
      'campera, abrigo o saco térmico y bufanda.'
    );
  }


  // ==========================================================
  // 5. CLIMA TEMPLADO / MODERADO
  // ==========================================================

  if (
    temperature > 12 &&
    temperature <= 22
  ) {
    return (
      'Clima templado: Ideal para llevar buzo, camisas ' +
      'de manga larga, sweater ligero o campera liviana.'
    );
  }


  // ==========================================================
  // 6. CALOR SECO / NORMAL
  // ==========================================================

  return (
    'Clima cálido: Te recomendamos usar remera, ' +
    'musculosa, shorts, vestidos o ropa liviana ' +
    'de algodón.'
  );
};


// ============================================================
// EXPORTS AUXILIARES
// ============================================================

export const WEATHER_WINDY_THRESHOLD_MS =
  WINDY_THRESHOLD_MS;