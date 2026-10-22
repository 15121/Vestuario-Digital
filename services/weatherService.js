// ============================================================
// SERVICIO DE CLIMA - OPENWEATHERMAP
// ============================================================

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

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

  if (!API_KEY) {
    throw new Error(
      'Falta configurar EXPO_PUBLIC_OPENWEATHER_API_KEY en el archivo .env.'
    );
  }

  const cleanCity = city.trim();

  const url =
    `${BASE_URL}?q=${encodeURIComponent(
      cleanCity
    )}&units=metric&lang=es&appid=${API_KEY}`;


  // ========================================================
  // PETICIÓN
  // ========================================================

  let response;

  try {
    response = await fetch(url);
  } catch (networkError) {
    // Sin conexión, timeout, etc.
    throw new Error(
      'No se pudo conectar. Revisá tu conexión a internet.'
    );
  }

  // Si la respuesta no es JSON válido, seguimos y dejamos
  // que las validaciones de abajo informen el error.
  let data = null;

  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }


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
      `${data.name}, ${data.sys?.country ?? ''}`,


    // ------------------------------------------------------
    // COORDENADAS (para el pronóstico del resto del día)
    // ------------------------------------------------------

    latitude:
      data.coord?.lat ?? null,

    longitude:
      data.coord?.lon ?? null,
  };
};


// ============================================================
// RECOMENDACIÓN GENERAL DE VESTIMENTA
// ============================================================
//
// IMPORTANTE:
//
// Estas funciones devuelven solamente el TEXTO general de
// recomendación (y etiquetas orientativas).
//
// La selección de prendas concretas del armario se realiza
// en utils/outfitRecommender.js y se muestra en
// weatherRecScreen.js.

/**
 * Devuelve la franja de temperatura según la temperatura
 * efectiva (sensación térmica).
 *
 * @param {number} effectiveTemp
 * @returns {'muy_frio'|'frio'|'fresco'|'templado'|'calido'|'caluroso'}
 */
const getTemperatureBand = (effectiveTemp) => {
  if (effectiveTemp <= 5) return 'muy_frio';
  if (effectiveTemp <= 11) return 'frio';
  if (effectiveTemp <= 16) return 'fresco';
  if (effectiveTemp <= 21) return 'templado';
  if (effectiveTemp <= 26) return 'calido';
  return 'caluroso';
};


const BAND_BASE = {
  muy_frio: {
    label: 'Clima muy frío',
    text:
      'Abrigate por capas: base térmica, sweater grueso y ' +
      'campera o abrigo pesado.',
    tags: [
      'abrigo_pesado',
      'sweater',
      'pantalon_largo',
      'bufanda',
      'gorro',
      'guantes',
      'botas',
    ],
  },

  frio: {
    label: 'Clima frío',
    text:
      'Usá campera o abrigo, un sweater o buzo abajo y ' +
      'pantalón largo.',
    tags: [
      'campera',
      'sweater',
      'pantalon_largo',
      'bufanda',
      'zapatillas',
    ],
  },

  fresco: {
    label: 'Clima fresco',
    text:
      'Ideal para buzo o sweater liviano con una campera ' +
      'fina o saco que puedas sacarte.',
    tags: [
      'buzo',
      'campera_liviana',
      'camisa_manga_larga',
      'pantalon_largo',
      'zapatillas',
    ],
  },

  templado: {
    label: 'Clima templado',
    text:
      'Camisa de manga larga o remera con una capa liviana ' +
      'por si refresca.',
    tags: [
      'camisa_manga_larga',
      'remera',
      'campera_liviana',
      'pantalon_largo',
      'zapatillas',
    ],
  },

  calido: {
    label: 'Clima cálido',
    text:
      'Remera, camisa de manga corta o vestido liviano, ' +
      'preferentemente de algodón.',
    tags: [
      'remera',
      'camisa_manga_corta',
      'vestido',
      'bermuda',
      'zapatillas',
    ],
  },

  caluroso: {
    label: 'Calor intenso',
    text:
      'Ropa muy liviana, holgada y de colores claros: ' +
      'musculosa, remera, shorts o vestido.',
    tags: [
      'musculosa',
      'remera',
      'shorts',
      'vestido',
      'sandalias',
      'gorra',
      'anteojos_sol',
    ],
  },
};


/**
 * Devuelve una recomendación general estructurada.
 *
 * Contempla: sensación térmica, lluvia, nieve, viento,
 * humedad, cielo despejado y niebla.
 *
 * @param {Object} params
 * @param {number} params.temp - Temperatura en °C.
 * @param {number} [params.feelsLike] - Sensación térmica en °C.
 * @param {string} params.conditionGroup - Grupo principal del clima.
 * @param {number} [params.humidity] - Porcentaje de humedad.
 * @param {number} [params.windSpeedMs] - Viento en m/s.
 * @param {boolean} [params.isWindy] - Si el viento es relevante.
 * @returns {{
 *   band: string,
 *   title: string,
 *   text: string,
 *   tips: string[],
 *   tags: string[]
 * }}
 */
export const getOutfitAdvice = ({
  temp,
  feelsLike,
  conditionGroup,
  humidity,
  windSpeedMs,
  isWindy,
}) => {
  const temperature =
    Number(temp);

  const feelsLikeValue =
    feelsLike === undefined || feelsLike === null
      ? NaN
      : Number(feelsLike);

  const effectiveTemp =
    Number.isFinite(feelsLikeValue)
      ? feelsLikeValue
      : temperature;

  const humidityValue =
    Number(humidity || 0);

  const windy =
    isWindy ??
    Number(windSpeedMs || 0) >= WINDY_THRESHOLD_MS;


  // ==========================================================
  // CONDICIONES CLIMÁTICAS
  // ==========================================================

  const isRaining =
    conditionGroup === 'Rain' ||
    conditionGroup === 'Drizzle' ||
    conditionGroup === 'Thunderstorm';

  const isSnowing =
    conditionGroup === 'Snow';

  const isFoggy =
    conditionGroup === 'Mist' ||
    conditionGroup === 'Fog' ||
    conditionGroup === 'Haze' ||
    conditionGroup === 'Smoke';

  const isClear =
    conditionGroup === 'Clear';

  const isHumid =
    humidityValue >= 75;

  const band =
    getTemperatureBand(effectiveTemp);

  const base =
    BAND_BASE[band];

  const tags =
    new Set(base.tags);

  const tips = [];


  // ==========================================================
  // PRECIPITACIONES
  // ==========================================================

  if (isSnowing) {
    [
      'abrigo_pesado',
      'guantes',
      'gorro',
      'botas',
      'impermeable',
    ].forEach((tag) => tags.add(tag));

    tips.push(
      'Usá calzado impermeable con buen agarre y abrigate por capas.'
    );
  } else if (isRaining) {
    ['impermeable', 'paraguas'].forEach(
      (tag) => tags.add(tag)
    );

    tags.delete('sandalias');
    tags.delete('anteojos_sol');
    tags.delete('gorra');

    if (
      band === 'calido' ||
      band === 'caluroso'
    ) {
      tips.push(
        'Elegí prendas de secado rápido y un piloto liviano.'
      );

      tips.push(
        'Evitá las sandalias abiertas.'
      );
    } else {
      tips.push(
        'Llevá piloto o campera impermeable y calzado que aguante el agua.'
      );
    }

    if (conditionGroup === 'Thunderstorm') {
      tips.push(
        'Hay tormenta eléctrica: evitá quedarte bajo árboles o en espacios abiertos.'
      );
    }
  }


  // ==========================================================
  // VIENTO
  // ==========================================================

  if (windy) {
    tags.add('campera_liviana');
    tags.add('cortaviento');

    // Con viento fuerte el paraguas suele romperse.
    tags.delete('paraguas');

    if (isRaining) {
      tips.push(
        'Con viento fuerte, un piloto con capucha rinde más que el paraguas.'
      );
    } else {
      tips.push(
        'Hay viento: sumá un cortaviento y evitá prendas muy sueltas o sombreros.'
      );
    }
  }


  // ==========================================================
  // HUMEDAD
  // ==========================================================

  if (
    isHumid &&
    effectiveTemp > 22 &&
    !isRaining
  ) {
    ['algodon', 'lino', 'colores_claros'].forEach(
      (tag) => tags.add(tag)
    );

    tips.push(
      'Humedad alta: preferí algodón o lino, holgado y de colores claros.'
    );
  }

  if (
    isHumid &&
    effectiveTemp <= 11
  ) {
    tips.push(
      'La humedad aumenta la sensación de frío: abrigate un poco más.'
    );
  }


  // ==========================================================
  // SOL
  // ==========================================================

  if (
    isClear &&
    effectiveTemp >= 20 &&
    !isRaining
  ) {
    ['anteojos_sol', 'gorra'].forEach(
      (tag) => tags.add(tag)
    );

    tips.push(
      'Día despejado: no te olvides de los anteojos de sol y el protector solar.'
    );
  }


  // ==========================================================
  // NIEBLA
  // ==========================================================

  if (isFoggy) {
    tips.push(
      'Visibilidad reducida: si salís de noche, elegí prendas claras.'
    );
  }


  // ==========================================================
  // DIFERENCIA ENTRE TEMPERATURA REAL Y SENSACIÓN
  // ==========================================================

  if (
    Number.isFinite(temperature) &&
    Math.abs(effectiveTemp - temperature) >= 3
  ) {
    tips.push(
      effectiveTemp < temperature
        ? `La sensación térmica es de ${Math.round(effectiveTemp)}°C, más fría que la temperatura real.`
        : `La sensación térmica es de ${Math.round(effectiveTemp)}°C, más calurosa que la temperatura real.`
    );
  }


  // ==========================================================
  // RESULTADO
  // ==========================================================

  const title =
    isSnowing
      ? `${base.label} con nieve`
      : isRaining
        ? `${base.label} con lluvia`
        : windy
          ? `${base.label} con viento`
          : base.label;

  const text =
    [`${title}: ${base.text}`, ...tips].join(' ');

  return {
    band,
    title,
    text,
    tips,
    tags: Array.from(tags),
  };
};


/**
 * Versión compatible con el uso anterior: devuelve solo el texto.
 *
 * Para aprovechar la sensación térmica y el viento, pasar
 * el cuarto parámetro:
 *
 *   getOutfitRecommendation(temp, group, humidity, {
 *     feelsLike,
 *     windSpeedMs,
 *     isWindy,
 *   });
 *
 * @param {number} temp
 * @param {string} conditionGroup
 * @param {number} humidity
 * @param {Object} [options]
 * @returns {string}
 */
export const getOutfitRecommendation = (
  temp,
  conditionGroup,
  humidity,
  options = {}
) => {
  return getOutfitAdvice({
    temp,
    conditionGroup,
    humidity,
    feelsLike: options.feelsLike,
    windSpeedMs: options.windSpeedMs,
    isWindy: options.isWindy,
  }).text;
};


// ============================================================
// EXPORTS AUXILIARES
// ============================================================

export const WEATHER_WINDY_THRESHOLD_MS =
  WINDY_THRESHOLD_MS;