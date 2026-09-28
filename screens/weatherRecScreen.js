
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';

import {
  getWeatherByCity,
} from '../services/weatherService';

import {
  getUserClothes,
} from '../services/database';

import {
  getUserCity,
  saveUserCity,
} from '../services/weatherStorage';

// ------------------------------------------------------------
// COMPONENTES COMPARTIDOS
//
// Se reutilizan el header, el sidebar de escritorio y el botón
// "+" EXACTOS que usa MainTabNavigator.js, para que esta
// pantalla sea visualmente idéntica al resto de la app y no
// haya que mantener dos copias de los mismos íconos/estilos.
// ------------------------------------------------------------

import {
  AppHeader,
  DesktopSidebar,
  MobileAddButton,
} from '../navigation/MainTabNavigator';

import AddMenuModal from '../components/AddMenuModal';
import SideMenu from '../components/sideMenu';


// ============================================================
// CONSTANTES
// ============================================================

const WEATHER_ICON_URL =
  'https://openweathermap.org/img/wn';

const DESKTOP_BREAKPOINT = 768;

const SIDEBAR_WIDTH = 140;

const MOBILE_HEADER_HEIGHT = 82;

const DESKTOP_HEADER_HEIGHT = 82;

const MOBILE_BOTTOM_NAV_HEIGHT = 78;


// ============================================================
// FUNCIONES GENERALES
// ============================================================

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};


const getUserIdentifier = (user) => {
  return (
    user?.id ??
    user?.id_usuario ??
    null
  );
};


// ============================================================
// DATOS DE PRENDAS
// ============================================================

const getClothingTitle = (item) => {
  return (
    item?.title ||
    item?.name ||
    item?.nombre ||
    'Prenda sin nombre'
  );
};


const getClothingCategory = (item) => {
  return (
    item?.category ||
    item?.categoria ||
    'Sin categoría'
  );
};


const getClothingColor = (item) => {
  return (
    item?.color ||
    'Sin color'
  );
};


const getClothingImage = (item) => {
  return (
    item?.imageUri ||
    item?.image ||
    item?.foto ||
    item?.photo ||
    null
  );
};


const getClothingDescription = (item) => {
  return (
    item?.description ||
    item?.descripcion ||
    ''
  );
};


const getClothingSeason = (item) => {
  return (
    item?.season ||
    item?.temporada ||
    ''
  );
};


const getItemId = (item, index = 0) => {
  return (
    item?.id ??
    item?.id_prenda ??
    item?.idClothing ??
    `clothing-${index}`
  );
};


// ============================================================
// CATEGORÍAS
// ============================================================

const isTopClothing = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const text =
    `${category} ${title}`;

  return (
    text.includes('remera') ||
    text.includes('camiseta') ||
    text.includes('camisa') ||
    text.includes('blusa') ||
    text.includes('top') ||
    text.includes('musculosa') ||
    text.includes('buzo') ||
    text.includes('sweater') ||
    text.includes('pulover') ||
    text.includes('campera') ||
    text.includes('abrigo') ||
    text.includes('saco') ||
    text.includes('chaqueta') ||
    text.includes('chaleco')
  );
};


const isBottomClothing = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const text =
    `${category} ${title}`;

  return (
    text.includes('pantalon') ||
    text.includes('jean') ||
    text.includes('falda') ||
    text.includes('pollera') ||
    text.includes('short') ||
    text.includes('bermuda') ||
    text.includes('calza') ||
    text.includes('legging')
  );
};


const isFootwear = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const text =
    `${category} ${title}`;

  return (
    text.includes('calzado') ||
    text.includes('zapatilla') ||
    text.includes('zapato') ||
    text.includes('bota') ||
    text.includes('sandalia') ||
    text.includes('borcego')
  );
};


// ============================================================
// CARACTERÍSTICAS TÉRMICAS DE LA PRENDA
// ============================================================

const isWarmClothing = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const description =
    normalizeText(
      getClothingDescription(item)
    );

  const season =
    normalizeText(
      getClothingSeason(item)
    );

  const text =
    `${category} ${title} ${description}`;

  return (
    text.includes('abrigo') ||
    text.includes('campera') ||
    text.includes('parka') ||
    text.includes('saco') ||
    text.includes('buzo') ||
    text.includes('sweater') ||
    text.includes('pulover') ||
    text.includes('chaleco') ||
    text.includes('bufanda') ||
    text.includes('gorro') ||
    text.includes('guante') ||
    text.includes('termica') ||
    text.includes('termico') ||
    season.includes('invierno')
  );
};


const isLightClothing = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const description =
    normalizeText(
      getClothingDescription(item)
    );

  const season =
    normalizeText(
      getClothingSeason(item)
    );

  const text =
    `${category} ${title} ${description}`;

  return (
    text.includes('remera') ||
    text.includes('camiseta') ||
    text.includes('musculosa') ||
    text.includes('short') ||
    text.includes('bermuda') ||
    text.includes('vestido') ||
    text.includes('falda') ||
    text.includes('pollera') ||
    season.includes('verano')
  );
};


const isShortSleeve = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const description =
    normalizeText(
      getClothingDescription(item)
    );

  const text =
    `${category} ${title} ${description}`;

  return (
    text.includes('manga corta') ||
    text.includes('manga corta') ||
    text.includes('manga-corta')
  );
};


const isLongSleeve = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const description =
    normalizeText(
      getClothingDescription(item)
    );

  const text =
    `${category} ${title} ${description}`;

  return (
    text.includes('manga larga') ||
    text.includes('manga larga') ||
    text.includes('manga-larga') ||
    text.includes('manga larga')
  );
};


const isRainProtected = (item) => {
  const category =
    normalizeText(
      getClothingCategory(item)
    );

  const title =
    normalizeText(
      getClothingTitle(item)
    );

  const description =
    normalizeText(
      getClothingDescription(item)
    );

  const text =
    `${category} ${title} ${description}`;

  return (
    text.includes('impermeable') ||
    text.includes('piloto') ||
    text.includes('lluvia') ||
    text.includes('waterproof')
  );
};


// ============================================================
// CONDICIÓN CLIMÁTICA
// ============================================================

const isRainWeather = (weather) => {
  const condition =
    weather?.conditionGroup || '';

  return (
    condition === 'Rain' ||
    condition === 'Drizzle' ||
    condition === 'Thunderstorm'
  );
};


const isSnowWeather = (weather) => {
  return (
    weather?.conditionGroup === 'Snow'
  );
};


const isColdWeather = (weather) => {
  return (
    Number(weather?.temp ?? 0) <= 12
  );
};


const isMildWeather = (weather) => {
  const temperature =
    Number(weather?.temp ?? 0);

  return (
    temperature > 12 &&
    temperature <= 22
  );
};


const isHotWeather = (weather) => {
  return (
    Number(weather?.temp ?? 0) > 22
  );
};


// ============================================================
// DETERMINAR SI UNA PRENDA ES ADECUADA
// ============================================================

const isSuitableForWeather = (
  item,
  weather
) => {
  if (!item || !weather) {
    return false;
  }

  const temperature =
    Number(weather.temp ?? 0);

  const rain =
    isRainWeather(weather);

  const snow =
    isSnowWeather(weather);

  const warm =
    isWarmClothing(item);

  const light =
    isLightClothing(item);

  const shortSleeve =
    isShortSleeve(item);

  const longSleeve =
    isLongSleeve(item);

  const footwear =
    isFootwear(item);

  const bottom =
    isBottomClothing(item);

  const rainProtected =
    isRainProtected(item);


  // ==========================================================
  // NIEVE
  // ==========================================================

  if (snow) {
    return (
      warm ||
      rainProtected ||
      footwear
    );
  }


  // ==========================================================
  // FRÍO FUERTE
  // <= 12 °C
  // ==========================================================

  if (temperature <= 12) {

    // Una prenda explícitamente de manga corta
    // NO es apropiada para frío fuerte.
    if (shortSleeve) {
      return false;
    }

    // Una prenda liviana tampoco se recomienda
    // por sí sola en este rango.
    if (
      light &&
      !warm &&
      !longSleeve &&
      !bottom &&
      !footwear
    ) {
      return false;
    }

    // Para frío aceptamos prendas de abrigo,
    // manga larga, pantalones y calzado.
    return (
      warm ||
      longSleeve ||
      bottom ||
      footwear
    );
  }


  // ==========================================================
  // CLIMA TEMPLADO
  // > 12 °C y <= 22 °C
  // ==========================================================

  if (temperature <= 22) {

    // En lluvia priorizamos protección.
    if (rain) {
      return (
        rainProtected ||
        footwear ||
        warm
      );
    }

    return (
      isTopClothing(item) ||
      bottom ||
      footwear
    );
  }


  // ==========================================================
  // CALOR
  // > 22 °C
  // ==========================================================

  if (temperature > 22) {

    // Evitamos recomendar prendas muy abrigadas
    // en condiciones de calor.
    if (warm && !light) {
      return false;
    }

    return (
      light ||
      footwear
    );
  }


  return false;
};


// ============================================================
// PUNTAJE DE PRENDA
// ============================================================

const getClothingScore = (
  item,
  weather
) => {
  if (
    !item ||
    !weather ||
    !isSuitableForWeather(item, weather)
  ) {
    return -Infinity;
  }

  const temperature =
    Number(weather.temp ?? 0);

  const rain =
    isRainWeather(weather);

  const snow =
    isSnowWeather(weather);

  const warm =
    isWarmClothing(item);

  const light =
    isLightClothing(item);

  const longSleeve =
    isLongSleeve(item);

  const bottom =
    isBottomClothing(item);

  const footwear =
    isFootwear(item);

  const rainProtected =
    isRainProtected(item);

  let score = 0;


  // ==========================================================
  // FRÍO
  // ==========================================================

  if (temperature <= 12) {

    if (warm) {
      score += 20;
    }

    if (longSleeve) {
      score += 10;
    }

    if (bottom) {
      score += 7;
    }

    if (footwear) {
      score += 5;
    }

    if (light) {
      score -= 10;
    }
  }


  // ==========================================================
  // TEMPLADO
  // ==========================================================

  if (
    temperature > 12 &&
    temperature <= 22
  ) {

    if (isTopClothing(item)) {
      score += 8;
    }

    if (bottom) {
      score += 7;
    }

    if (longSleeve) {
      score += 5;
    }

    if (warm) {
      score += 4;
    }

    if (footwear) {
      score += 3;
    }
  }


  // ==========================================================
  // CALOR
  // ==========================================================

  if (temperature > 22) {

    if (light) {
      score += 12;
    }

    if (footwear) {
      score += 5;
    }

    if (warm) {
      score -= 10;
    }
  }


  // ==========================================================
  // LLUVIA
  // ==========================================================

  if (rain) {

    if (rainProtected) {
      score += 20;
    }

    if (footwear) {
      score += 8;
    }
  }


  // ==========================================================
  // NIEVE
  // ==========================================================

  if (snow) {

    if (warm) {
      score += 20;
    }

    if (footwear) {
      score += 8;
    }
  }


  return score;
};


// ============================================================
// CONSTRUIR RECOMENDACIONES
// ============================================================

const buildRecommendations = (
  clothes,
  weather
) => {
  if (
    !Array.isArray(clothes) ||
    clothes.length === 0 ||
    !weather
  ) {
    return [];
  }


  // ==========================================================
  // FILTRAR SOLAMENTE PRENDAS ADECUADAS
  // ==========================================================

  const suitableClothes =
    clothes.filter(
      (item) =>
        isSuitableForWeather(
          item,
          weather
        )
    );


  // IMPORTANTE:
  // Si no existe ninguna prenda apropiada,
  // devolvemos un array vacío.
  //
  // NO se agregan prendas inadecuadas solamente
  // para completar tres tarjetas.

  if (
    suitableClothes.length === 0
  ) {
    return [];
  }


  // ==========================================================
  // ORDENAR POR PUNTAJE
  // ==========================================================

  const sortedClothes =
    [...suitableClothes].sort(
      (firstItem, secondItem) =>
        getClothingScore(
          secondItem,
          weather
        ) -
        getClothingScore(
          firstItem,
          weather
        )
    );


  // ==========================================================
  // EVITAR DUPLICADOS
  // ==========================================================

  const selectedItems = [];

  const addIfAvailable = (item) => {
    if (!item) {
      return;
    }

    const alreadySelected =
      selectedItems.some(
        (selectedItem, selectedIndex) =>
          String(
            getItemId(
              selectedItem,
              selectedIndex
            )
          ) ===
          String(
            getItemId(
              item,
              0
            )
          )
      );

    if (!alreadySelected) {
      selectedItems.push(item);
    }
  };


  // ==========================================================
  // BUSCAR PRENDA SUPERIOR
  // ==========================================================

  const top =
    sortedClothes.find(
      (item) =>
        isTopClothing(item)
    );

  addIfAvailable(top);


  // ==========================================================
  // BUSCAR PRENDA INFERIOR
  // ==========================================================

  const bottom =
    sortedClothes.find(
      (item) =>
        isBottomClothing(item)
    );

  addIfAvailable(bottom);


  // ==========================================================
  // BUSCAR TERCERA PRENDA
  // ==========================================================

  const thirdItem =
    sortedClothes.find(
      (item) => {
        const alreadySelected =
          selectedItems.some(
            (selectedItem) =>
              String(
                getItemId(
                  selectedItem,
                  0
                )
              ) ===
              String(
                getItemId(
                  item,
                  0
                )
              )
          );

        return !alreadySelected;
      }
    );

  addIfAvailable(thirdItem);


  // ==========================================================
  // SI TODAVÍA HAY ESPACIO, AGREGAR OTRAS PRENDAS VÁLIDAS
  // ==========================================================

  sortedClothes.forEach(
    (item) => {
      if (
        selectedItems.length >= 3
      ) {
        return;
      }

      addIfAvailable(item);
    }
  );


  return selectedItems.slice(0, 3);
};


// ============================================================
// ETIQUETA DE CONDICIÓN CLIMÁTICA
// ============================================================

const getConditionLabel = (
  weather
) => {
  if (!weather) {
    return '';
  }


  // Si el servicio determinó que el viento
  // es suficientemente relevante, lo mostramos
  // como condición visual principal.
  if (
    weather.weatherIconType === 'wind' ||
    weather.isWindy === true
  ) {
    return 'Viento';
  }


  if (
    weather.displayDescription
  ) {
    return weather.displayDescription;
  }


  if (
    weather.conditionDescription
  ) {
    const description =
      weather.conditionDescription;

    return (
      description.charAt(0).toUpperCase() +
      description.slice(1)
    );
  }


  switch (
    weather.conditionGroup
  ) {
    case 'Clear':
      return 'Despejado';

    case 'Clouds':
      return 'Nublado';

    case 'Rain':
      return 'Lluvia';

    case 'Drizzle':
      return 'Llovizna';

    case 'Thunderstorm':
      return 'Tormenta';

    case 'Snow':
      return 'Nieve';

    case 'Mist':
      return 'Neblina';

    case 'Fog':
      return 'Niebla';

    case 'Haze':
      return 'Calima';

    case 'Dust':
      return 'Polvo';

    case 'Sand':
      return 'Arena';

    case 'Smoke':
      return 'Humo';

    case 'Ash':
      return 'Ceniza';

    case 'Squall':
      return 'Ráfaga';

    case 'Tornado':
      return 'Tornado';

    default:
      return 'Clima actual';
  }
};


// ============================================================
// COMPONENTE: TARJETA DEL CLIMA
// ============================================================

const WeatherCard = ({
  weather,
  onChangeCity,
}) => {
  if (!weather) {
    return null;
  }

  const conditionLabel =
    getConditionLabel(weather);

  const iconCode =
    weather.iconCode;

  const isWindy =
    weather.weatherIconType === 'wind' ||
    weather.isWindy === true;

  const weatherIconUri =
    iconCode
      ? `${WEATHER_ICON_URL}/${iconCode}@2x.png`
      : null;

  return (
    <View
      style={
        weatherCardStyles.card
      }
    >
      <View
        style={
          weatherCardStyles.topRow
        }
      >
        <View
          style={
            weatherCardStyles.cityContainer
          }
        >
          <View
            style={
              weatherCardStyles.cityLabelRow
            }
          >
            <Ionicons
              name="location"
              size={17}
              color="#8C73D6"
            />

            <Text
              style={
                weatherCardStyles.cityName
              }
              numberOfLines={1}
            >
              {weather.city ||
                'Ciudad'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onChangeCity}
          style={
            weatherCardStyles.changeButton
          }
        >
          <Ionicons
            name="location-outline"
            size={15}
            color="#FFFFFF"
          />

          <Text
            style={
              weatherCardStyles.changeButtonText
            }
          >
            Cambiar ciudad
          </Text>
        </TouchableOpacity>
      </View>


      <View
        style={
          weatherCardStyles.weatherMain
        }
      >
        <View
          style={
            weatherCardStyles.iconContainer
          }
        >
          {isWindy ? (
            <MaterialCommunityIcons
              name="weather-windy"
              size={64}
              color="#8C73D6"
            />
          ) : weatherIconUri ? (
            <Image
              source={{
                uri: weatherIconUri,
              }}
              style={
                weatherCardStyles.weatherIcon
              }
              resizeMode="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={64}
              color="#8C73D6"
            />
          )}
        </View>


        <View
          style={
            weatherCardStyles.temperatureContainer
          }
        >
          <Text
            style={
              weatherCardStyles.temperature
            }
          >
            {weather.temp}°C
          </Text>

          <Text
            style={
              weatherCardStyles.condition
            }
          >
            {conditionLabel}
          </Text>
        </View>
      </View>


      <View
        style={
          weatherCardStyles.divider
        }
      />


      <View
        style={
          weatherCardStyles.bottomInfo
        }
      >
        <View
          style={
            weatherCardStyles.infoItem
          }
        >
          <Ionicons
            name="thermometer-outline"
            size={18}
            color="#8C73D6"
          />

          <Text
            style={
              weatherCardStyles.infoLabel
            }
          >
            Sensación térmica
          </Text>

          <Text
            style={
              weatherCardStyles.infoValue
            }
          >
            {weather.feelsLike}°C
          </Text>
        </View>

        {weather.humidity !==
          undefined &&
          weather.humidity !==
            null && (
            <View
              style={
                weatherCardStyles.infoItem
              }
            >
              <Ionicons
                name="water-outline"
                size={18}
                color="#8C73D6"
              />

              <Text
                style={
                  weatherCardStyles.infoLabel
                }
              >
                Humedad
              </Text>

              <Text
                style={
                  weatherCardStyles.infoValue
                }
              >
                {weather.humidity}%
              </Text>
            </View>
          )}

        {weather.windSpeedKmh !==
          undefined &&
          weather.windSpeedKmh !==
            null && (
            <View
              style={
                weatherCardStyles.infoItem
              }
            >
              <MaterialCommunityIcons
                name="weather-windy"
                size={18}
                color="#8C73D6"
              />

              <Text
                style={
                  weatherCardStyles.infoLabel
                }
              >
                Viento
              </Text>

              <Text
                style={
                  weatherCardStyles.infoValue
                }
              >
                {Math.round(
                  weather.windSpeedKmh
                )}{' '}
                km/h
              </Text>
            </View>
          )}
      </View>
    </View>
  );
};


// ============================================================
// COMPONENTE: TARJETA DE PRENDA
// ============================================================

// ============================================================
// COLOR DE REFERENCIA PARA EL PUNTO DE COLOR
// ============================================================

const CLOTHING_COLOR_DOT_MAP = {
  blanco: '#FFFFFF',
  negro: '#1A1A1A',
  gris: '#9CA3AF',
  plomo: '#9CA3AF',
  azul: '#2563EB',
  celeste: '#38BDF8',
  rojo: '#DC2626',
  rosa: '#EC4899',
  fucsia: '#EC4899',
  verde: '#16A34A',
  amarillo: '#FACC15',
  naranja: '#F97316',
  marron: '#78350F',
  beige: '#D6C7A1',
  crema: '#EADFC5',
  violeta: '#7C3AED',
  morado: '#7C3AED',
  lila: '#C4B5FD',
  bordo: '#7F1D1D',
  dorado: '#D4AF37',
  plateado: '#C0C0C0',
};

const getClothingColorDot = (colorName) => {
  const normalized =
    normalizeText(colorName);

  return (
    CLOTHING_COLOR_DOT_MAP[normalized] ||
    '#CBD5E1'
  );
};


const ClothingRecommendationCard = ({
  item,
}) => {
  const title =
    getClothingTitle(item);

  const category =
    getClothingCategory(item);

  const color =
    getClothingColor(item);

  const image =
    getClothingImage(item);

  const colorDot =
    getClothingColorDot(color);

  return (
    <View
      style={
        recommendationStyles.card
      }
    >
      <View
        style={
          recommendationStyles.imageContainer
        }
      >
        {image ? (
          <Image
            source={{
              uri: image,
            }}
            style={
              recommendationStyles.image
            }
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              recommendationStyles.placeholder
            }
          >
            <Ionicons
              name="shirt-outline"
              size={28}
              color="#A8A8A8"
            />
          </View>
        )}
      </View>

      <View
        style={
          recommendationStyles.content
        }
      >
        <Text
          style={
            recommendationStyles.title
          }
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={
            recommendationStyles.category
          }
          numberOfLines={1}
        >
          Categoría: {category}
        </Text>

        <View
          style={
            recommendationStyles.colorRow
          }
        >
          <View
            style={[
              recommendationStyles.colorDot,
              {
                backgroundColor: colorDot,
              },
            ]}
          />

          <Text
            style={
              recommendationStyles.colorText
            }
            numberOfLines={1}
          >
            {color}
          </Text>
        </View>
      </View>
    </View>
  );
};


// ============================================================
// COMPONENTE: ESTADO VACÍO
// ============================================================

const EmptyRecommendationState = ({
  hasClothes,
}) => {
  return (
    <View
      style={
        emptyStateStyles.container
      }
    >
      <View
        style={
          emptyStateStyles.iconContainer
        }
      >
        <MaterialCommunityIcons
          name="hanger"
          size={48}
          color="#8C73D6"
        />
      </View>

      <Text
        style={
          emptyStateStyles.title
        }
      >
        {hasClothes
          ? 'No hay prendas de acuerdo a este clima.'
          : 'Todavía no tenés prendas.'}
      </Text>

      <Text
        style={
          emptyStateStyles.description
        }
      >
        {hasClothes
          ? 'Probá agregando prendas que se adapten a las condiciones climáticas actuales.'
          : 'Agregá prendas a tu armario para recibir recomendaciones según el clima.'}
      </Text>
    </View>
  );
};




// ============================================================
// MODAL PARA CAMBIAR CIUDAD
// ============================================================

const CityModal = ({
  visible,
  cityInput,
  setCityInput,
  onClose,
  onConfirm,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
    >
      <Pressable
        style={
          cityModalStyles.overlay
        }
        onPress={onClose}
      >
        <Pressable
          style={
            cityModalStyles.modal
          }
          onPress={(event) =>
            event.stopPropagation()
          }
        >
          <View
            style={
              cityModalStyles.header
            }
          >
            <View
              style={
                cityModalStyles.titleContainer
              }
            >
              <Ionicons
                name="location-outline"
                size={24}
                color="#8C73D6"
              />

              <Text
                style={
                  cityModalStyles.title
                }
              >
                Cambiar ciudad
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={26}
                color="#666666"
              />
            </TouchableOpacity>
          </View>

          <Text
            style={
              cityModalStyles.description
            }
          >
            Ingresá la ciudad para consultar
            el clima y obtener recomendaciones
            para tus prendas.
          </Text>

          <TextInput
            value={cityInput}
            onChangeText={
              setCityInput
            }
            placeholder="Ej. Buenos Aires"
            placeholderTextColor="#999999"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={
              onConfirm
            }
            style={
              cityModalStyles.input
            }
          />

          <View
            style={
              cityModalStyles.buttons
            }
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={
                cityModalStyles.cancelButton
              }
            >
              <Text
                style={
                  cityModalStyles.cancelText
                }
              >
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              disabled={loading}
              style={[
                cityModalStyles.confirmButton,
                loading &&
                  cityModalStyles.disabledButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    cityModalStyles.confirmText
                  }
                >
                  Consultar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const WeatherRecScreen = ({
  navigation,
  route,
}) => {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width > DESKTOP_BREAKPOINT;

  const user =
    route?.params?.user ??
    null;


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [weather, setWeather] =
    useState(null);

  const [clothes, setClothes] =
    useState([]);

  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingWeather, setLoadingWeather] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [city, setCity] =
    useState('');

  const [cityInput, setCityInput] =
    useState('');

  const [cityModalVisible, setCityModalVisible] =
    useState(false);

  const [sideMenuVisible, setSideMenuVisible] =
    useState(false);

  const [addMenuVisible, setAddMenuVisible] =
    useState(false);


  // ==========================================================
  // IDENTIFICADOR DEL USUARIO
  // ==========================================================

  const userId =
    useMemo(
      () =>
        getUserIdentifier(user),
      [user]
    );


  // ==========================================================
  // CARGAR PRENDAS
  // ==========================================================

  const loadClothes = useCallback(
    async () => {
      if (
        userId === null ||
        userId === undefined
      ) {
        setClothes([]);
        return [];
      }

      try {
        const result =
          await getUserClothes(
            userId
          );

        const normalized =
          Array.isArray(result)
            ? result
            : [];

        setClothes(
          normalized
        );

        return normalized;
      } catch (error) {
        console.log(
          'Error al cargar prendas:',
          error
        );

        setClothes([]);

        return [];
      }
    },
    [userId]
  );


  // ==========================================================
  // ACTUALIZAR RECOMENDACIONES
  // ==========================================================

  const updateRecommendations =
    useCallback(
      (
        weatherResult,
        currentClothes
      ) => {
        if (!weatherResult) {
          setRecommendations(
            []
          );
          return;
        }

        const sourceClothes =
          Array.isArray(
            currentClothes
          )
            ? currentClothes
            : [];

        const nextRecommendations =
          buildRecommendations(
            sourceClothes,
            weatherResult
          );

        setRecommendations(
          nextRecommendations
        );
      },
      []
    );


  // ==========================================================
  // CARGAR CLIMA
  // ==========================================================
///////
const loadWeather = useCallback(
  async (cityToSearch) => {
    const cleanCity = String(cityToSearch || '').trim();
    if (!cleanCity) return;

    setLoadingWeather(true);
    setErrorMessage('');

    try {
      const weatherResult = await getWeatherByCity(cleanCity);

      setWeather(weatherResult);
      setCity(cleanCity);

      await saveUserCity(user, cleanCity);

      const refreshedClothes = await loadClothes();

      updateRecommendations(weatherResult, refreshedClothes);
    } catch (error) {
      console.log('Error al obtener clima:', error);
      setErrorMessage(error?.message || 'No se pudo obtener el clima en este momento.');
      setWeather(null);
      setRecommendations([]);
    } finally {
      setLoadingWeather(false);
      setLoading(false);
    }
  },
  [loadClothes, updateRecommendations, user] // sin "clothes"
);

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const initialize =
      async () => {
        setLoading(true);

        try {
          const savedCity =
            await getUserCity(
              user
            );

          const loadedClothes =
            await loadClothes();

          if (!mounted) {
            return;
          }

          if (
            savedCity &&
            savedCity.trim()
          ) {
            setCity(
              savedCity
            );

            setCityInput(
              savedCity
            );

            await loadWeather(
              savedCity,
              loadedClothes
            );
          } else {
            setWeather(null);

            setRecommendations(
              []
            );

            setCity('');

            setCityInput('');

            setLoading(false);
          }
        } catch (error) {
          console.log(
            'Error inicializando pantalla climática:',
            error
          );

          if (mounted) {
            setLoading(false);

            setErrorMessage(
              'No se pudo cargar la información climática.'
            );
          }
        }
      };

    initialize();

    return () => {
      mounted = false;
    };
  }, [
    loadClothes,
    loadWeather,
    user,
  ]);


  // ==========================================================
  // ACTUALIZAR CUANDO CAMBIAN LAS PRENDAS
  // ==========================================================
 useEffect(() => {
  let mounted = true;

  const initialize = async () => {
    setLoading(true);
    try {
      const savedCity = await getUserCity(user);
      const loadedClothes = await loadClothes();

      if (!mounted) return;

      if (savedCity && savedCity.trim()) {
        setCity(savedCity);
        setCityInput(savedCity);
        await loadWeather(savedCity);
      } else {
        setWeather(null);
        setRecommendations([]);
        setCity('');
        setCityInput('');
        setLoading(false);
      }
    } catch (error) {
      console.log('Error inicializando pantalla climática:', error);
      if (mounted) {
        setLoading(false);
        setErrorMessage('No se pudo cargar la información climática.');
      }
    }
  };

initialize();

  return () => { mounted = false; };
}, [userId]); // sólo cuando cambia el usuario, no en cada render de funciones
  // ==========================================================
  // CAMBIAR CIUDAD
  // ==========================================================

  const openCityModal = () => {
    setCityInput(city || '');
    setCityModalVisible(true);
  };


  const closeCityModal = () => {
    if (loadingWeather) {
      return;
    }

    Keyboard.dismiss();

    setCityModalVisible(false);
  };


  const handleConfirmCity = async () => {
    const cleanCity = cityInput.trim();

    if (!cleanCity) {
      setErrorMessage('Debes ingresar el nombre de una ciudad.');
      return;
    }

    Keyboard.dismiss();

    await loadWeather(cleanCity);

    setCityModalVisible(false);
  };


  // ==========================================================
  // ACTUALIZAR RECOMENDACIONES (BOTÓN MANUAL)
  // ==========================================================

  const [refreshingRecommendations, setRefreshingRecommendations] =
    useState(false);

  const handleRefreshRecommendations = async () => {
    if (refreshingRecommendations) {
      return;
    }

    setRefreshingRecommendations(true);

    try {
      if (city) {
        await loadWeather(city);
      } else {
        const freshClothes = await loadClothes();
        updateRecommendations(weather, freshClothes);
      }
    } finally {
      setRefreshingRecommendations(false);
    }
  };


  // ==========================================================
  // NAVEGACIÓN DEL SIDEBAR
  // ==========================================================


  const handleOpenAddMenu = () => {
    setAddMenuVisible(true);
  };

  const handleCloseAddMenu = () => {
    setAddMenuVisible(false);
  };

  const handleOpenSideMenu = () => {
    setSideMenuVisible(true);
  };

  const handleCloseSideMenu = () => {
    setSideMenuVisible(false);
  };


  // ==========================================================
  // AGREGAR PRENDA / CREAR OUTFIT
  // (mismo comportamiento que en MainTabNavigator.js)
  // ==========================================================

  const handleAddClothing = () => {
    setAddMenuVisible(false);

    if (navigation?.navigate) {
      navigation.navigate('AddClothing', { user });
    }
  };

  const handleCreateOutfit = () => {
    setAddMenuVisible(false);

    if (navigation?.navigate) {
      navigation.navigate('CreateOutfit', { user });
    }
  };


  // ==========================================================
  // PERFIL / ACERCA DE / AYUDA / CERRAR SESIÓN
  // (mismo comportamiento que en MainTabNavigator.js)
  // ==========================================================

  const handleProfile = () => {
    setSideMenuVisible(false);

    if (navigation?.navigate) {
      navigation.navigate('Profile', { user });
    }
  };

  const handleAbout = () => {
    setSideMenuVisible(false);

    if (navigation?.navigate) {
      navigation.navigate('AboutApp', { user });
    }
  };

  const handleHelp = () => {
    setSideMenuVisible(false);

    if (navigation?.navigate) {
      navigation.navigate('Help', { user });
    }
  };

  const handleLogout = () => {
    setSideMenuVisible(false);

    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            if (navigation?.replace) {
              navigation.replace('Login');
            }
          },
        },
      ]
    );
  };


  // ==========================================================
  // CAMBIAR DE SECCIÓN DESDE EL SIDEBAR DE ESCRITORIO
  //
  // WeatherRecScreen no vive dentro del Tab.Navigator, así
  // que en vez de cambiar de "tab" navega directamente a la
  // pantalla equivalente registrada en el Stack raíz.
  // ==========================================================

  const SIDEBAR_TAB_ROUTES = {
    Inicio: 'Main',
    Prendas: 'Clothing',
    Outfits: 'MyOutfits',
    Maleta: 'PackingModeScreen',
  };

  const handleSidebarChangeTab = (tabName) => {
    const targetRoute = SIDEBAR_TAB_ROUTES[tabName];

    if (targetRoute && navigation?.navigate) {
      navigation.navigate(targetRoute, { user });
    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <View
        style={
          screenStyles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#8C73D6"
        />

        <Text
          style={
            screenStyles.loadingText
          }
        >
          Cargando clima...
        </Text>
      </View>
    );
  }


  // ==========================================================
  // CONTENIDO PRINCIPAL
  // ==========================================================

  const hasClothes =
    clothes.length > 0;

  const showEmptyRecommendations =
    recommendations.length === 0;


  return (
    <View
      style={
        screenStyles.container
      }
    >
      <AppHeader
        title="Recomendación Climática"
        onBack={() =>
          navigation?.goBack?.()
        }
        onOpenProfile={
          handleProfile
        }
      />

      <View
        style={[
          screenStyles.body,
          isDesktop &&
            screenStyles.bodyDesktop,
        ]}
      >
        {isDesktop && (
          <DesktopSidebar
            activeTab={null}
            onChangeTab={
              handleSidebarChangeTab
            }
            onOpenAddMenu={
              handleOpenAddMenu
            }
          />
        )}

        <View
          style={
            screenStyles.content
          }
        >
        <ScrollView
          style={
            screenStyles.scroll
          }
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop &&
              screenStyles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={
              screenStyles.inner
            }
          >
            {errorMessage ? (
              <View
                style={
                  screenStyles.errorBox
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#B42318"
                />

                <Text
                  style={
                    screenStyles.errorText
                  }
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}


            <View
              style={[
                screenStyles.mainGrid,
                isDesktop &&
                  screenStyles.mainGridDesktop,
              ]}
            >

              {/* ==================================================
                  COLUMNA IZQUIERDA: CLIMA
                  ================================================== */}

              <View
                style={
                  isDesktop
                    ? screenStyles.weatherColumn
                    : screenStyles.fullWidthColumn
                }
              >
                {weather ? (
                  <WeatherCard
                    weather={
                      weather
                    }
                    onChangeCity={
                      openCityModal
                    }
                  />
                ) : (
                  <View
                    style={
                      screenStyles.noWeatherCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="weather-partly-cloudy"
                      size={52}
                      color="#8C73D6"
                    />

                    <Text
                      style={
                        screenStyles.noWeatherTitle
                      }
                    >
                      Consultá el clima
                    </Text>

                    <Text
                      style={
                        screenStyles.noWeatherDescription
                      }
                    >
                      Ingresá una ciudad para
                      conocer las condiciones
                      actuales y recibir
                      recomendaciones.
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={
                        openCityModal
                      }
                      style={
                        screenStyles.primaryButton
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          screenStyles.primaryButtonText
                        }
                      >
                        Ingresar ciudad
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>


              {/* ==================================================
                  COLUMNA DERECHA: PRENDAS RECOMENDADAS
                  ================================================== */}

              {weather && (
                <View
                  style={
                    isDesktop
                      ? screenStyles.recommendationsColumn
                      : screenStyles.fullWidthColumn
                  }
                >
                  <View
                    style={
                      screenStyles.recommendationsSection
                    }
                  >
                    <View
                      style={
                        screenStyles.sectionHeader
                      }
                    >
                      <View
                        style={
                          screenStyles.sectionHeaderIconCircle
                        }
                      >
                        <Ionicons
                          name="shirt-outline"
                          size={18}
                          color="#8C73D6"
                        />
                      </View>

                      <Text
                        style={
                          screenStyles.sectionTitle
                        }
                      >
                        Prendas recomendadas para hoy
                      </Text>
                    </View>


                    {showEmptyRecommendations ? (
                      <EmptyRecommendationState
                        hasClothes={
                          hasClothes
                        }
                      />
                    ) : (
                      <View
                        style={
                          screenStyles.recommendationsList
                        }
                      >
                        {recommendations.map(
                          (item, index) => (
                            <ClothingRecommendationCard
                              key={String(
                                getItemId(
                                  item,
                                  index
                                )
                              )}
                              item={item}
                            />
                          )
                        )}
                      </View>
                    )}


                    <View
                      style={
                        screenStyles.infoBox
                      }
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color="#8C73D6"
                      />

                      <Text
                        style={
                          screenStyles.infoBoxText
                        }
                      >
                        Estas recomendaciones se generan
                        utilizando las prendas que tenés
                        registradas en tu armario.
                      </Text>
                    </View>


                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={
                        refreshingRecommendations
                      }
                      onPress={
                        handleRefreshRecommendations
                      }
                      style={[
                        screenStyles.refreshButton,
                        refreshingRecommendations &&
                          screenStyles.refreshButtonDisabled,
                      ]}
                    >
                      {refreshingRecommendations ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="refresh"
                            size={18}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              screenStyles.refreshButtonText
                            }
                          >
                            Actualizar recomendaciones
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        </View>
      </View>


      {!isDesktop && (
        <View
          style={
            bottomNavigationStyles.container
          }
        >
          <TouchableOpacity
            activeOpacity={0.8}
           onPress={() => navigation.navigate('Main', { user })}
            style={
              bottomNavigationStyles.item
            }
          >
            <Ionicons
              name="home-outline"
              size={23}
              color="#6F6F6F"
            />

            <Text
              style={
                bottomNavigationStyles.label
              }
            >
              Inicio
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            activeOpacity={0.8}
         onPress={() => navigation.navigate('Clothing', { user })}
            style={
              bottomNavigationStyles.item
            }
          >
            <Ionicons
              name="shirt-outline"
              size={23}
              color="#6F6F6F"
            />

            <Text
              style={
                bottomNavigationStyles.label
              }
            >
              Prendas
            </Text>
          </TouchableOpacity>


          <MobileAddButton
            onPress={
              handleOpenAddMenu
            }
          />


          <TouchableOpacity
            activeOpacity={0.8}
          onPress={() => navigation.navigate('MyOutfits', { user })}
            style={
              bottomNavigationStyles.item
            }
          >
            <MaterialCommunityIcons
              name="hanger"
              size={23}
              color="#6F6F6F"
            />

            <Text
              style={
                bottomNavigationStyles.label
              }
            >
              Outfits
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            activeOpacity={0.8}
         onPress={() => navigation.navigate('PackingModeScreen', { user })}
            style={
              bottomNavigationStyles.item
            }
          >
            <Ionicons
              name="briefcase-outline"
              size={23}
              color="#6F6F6F"
            />

            <Text
              style={
                bottomNavigationStyles.label
              }
            >
              Maleta
            </Text>
          </TouchableOpacity>
        </View>
      )}


      <CityModal
        visible={
          cityModalVisible
        }
        cityInput={
          cityInput
        }
        setCityInput={
          setCityInput
        }
        onClose={
          closeCityModal
        }
        onConfirm={
          handleConfirmCity
        }
        loading={
          loadingWeather
        }
      />

 
      <SideMenu
        visible={sideMenuVisible}
        onClose={handleCloseSideMenu}
        onProfile={handleProfile}
        onAbout={handleAbout}
        onHelp={handleHelp}
        onLogout={handleLogout}
        user={user}
      />
 
 
      <AddMenuModal
        visible={addMenuVisible}
        onClose={handleCloseAddMenu}
        onAddPrenda={handleAddClothing}
        onAddOutfit={handleCreateOutfit}
      />
    </View>
  );
};


// ============================================================
// ESTILOS
// ============================================================

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  body: {
    flex: 1,
  },

  bodyDesktop: {
    flexDirection: 'row',
  },

  content: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom:
      MOBILE_BOTTOM_NAV_HEIGHT + 28,
  },

  scrollContentDesktop: {
    paddingBottom: 40,
  },

  inner: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 22,
  },

  mainGrid: {
    flexDirection: 'column',
    gap: 20,
  },

  mainGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },

  weatherColumn: {
    width: '40%',
    minWidth: 320,
  },

  recommendationsColumn: {
    flex: 1,
  },

  fullWidthColumn: {
    width: '100%',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FEECEC',
    borderWidth: 1,
    borderColor: '#F6B8B8',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#B42318',
    lineHeight: 20,
  },

  noWeatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE8F3',
    marginBottom: 22,
  },

  noWeatherTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '800',
    color: '#302B3B',
  },

  noWeatherDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#74707C',
    textAlign: 'center',
    maxWidth: 540,
  },

  primaryButton: {
    marginTop: 20,
    backgroundColor: '#8C73D6',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  recommendationsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#ECE8F3',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },

  sectionHeaderIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: '#302B3B',
  },

  recommendationsList: {
    flexDirection: 'column',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F1ECFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },

  infoBoxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#5B5566',
    fontFamily: 'Poppins_400Regular',
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8C73D6',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 16,
  },

  refreshButtonDisabled: {
    opacity: 0.7,
  },

  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5FB',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#706B79',
  },
});


const weatherCardStyles =
  StyleSheet.create({
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 22,
      padding: 22,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: '#ECE8F3',
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },

    cityContainer: {
      flex: 1,
    },

    cityLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    cityName: {
      color: '#302B3B',
      fontSize: 19,
      fontFamily: 'Poppins_700Bold',
    },

    changeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#8C73D6',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    changeButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Poppins_600SemiBold',
    },

    weatherMain: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 22,
      minHeight: 90,
    },

    iconContainer: {
      width: 90,
      height: 90,
      alignItems: 'center',
      justifyContent: 'center',
    },

    weatherIcon: {
      width: 90,
      height: 90,
    },

    temperatureContainer: {
      marginLeft: 10,
      flex: 1,
    },

    temperature: {
      color: '#302B3B',
      fontSize: 44,
      lineHeight: 50,
      fontFamily: 'Poppins_700Bold',
      letterSpacing: -1,
    },

    condition: {
      color: '#77727F',
      fontSize: 15,
      fontFamily: 'Poppins_400Regular',
      marginTop: 2,
    },

    divider: {
      height: 1,
      backgroundColor: '#F0EDF4',
      marginTop: 20,
      marginBottom: 16,
    },

    bottomInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 18,
      rowGap: 12,
    },

    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    infoLabel: {
      color: '#77727F',
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
    },

    infoValue: {
      color: '#302B3B',
      fontSize: 13,
      fontFamily: 'Poppins_600SemiBold',
    },
  });


const recommendationStyles =
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#F0EDF4',
      padding: 14,
      marginBottom: 12,
      gap: 14,
    },

    imageContainer: {
      width: 64,
      height: 64,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#F2EFF7',
      alignItems: 'center',
      justifyContent: 'center',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    placeholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: {
      flex: 1,
    },

    title: {
      color: '#302B3B',
      fontSize: 15,
      lineHeight: 19,
      fontFamily: 'Poppins_600SemiBold',
    },

    category: {
      color: '#77727F',
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
      marginTop: 4,
    },

    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 6,
    },

    colorDot: {
      width: 13,
      height: 13,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: '#E2E2E2',
    },

    colorText: {
      color: '#4E4A55',
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
    },
  });


const emptyStateStyles =
  StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#ECE8F3',
      borderRadius: 18,
      paddingHorizontal: 24,
      paddingVertical: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconContainer: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#F0EBFA',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 13,
    },

    title: {
      textAlign: 'center',
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '800',
      color: '#302B3B',
    },

    description: {
      marginTop: 7,
      maxWidth: 560,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 21,
      color: '#77727F',
    },
  });


const cityModalStyles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.42)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    modal: {
      width: '100%',
      maxWidth: 470,
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    title: {
      fontSize: 19,
      fontWeight: '800',
      color: '#302B3B',
    },

    description: {
      marginTop: 12,
      color: '#77727F',
      fontSize: 14,
      lineHeight: 20,
    },

    input: {
      marginTop: 17,
      height: 48,
      borderWidth: 1,
      borderColor: '#DCD6E8',
      borderRadius: 11,
      paddingHorizontal: 13,
      color: '#302B3B',
      fontSize: 15,
      backgroundColor: '#FAF9FC',
    },

    buttons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 18,
    },

    cancelButton: {
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 11,
      backgroundColor: '#F0EDF4',
    },

    cancelText: {
      color: '#66616E',
      fontSize: 14,
      fontWeight: '700',
    },

    confirmButton: {
      minWidth: 105,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: '#8C73D6',
      alignItems: 'center',
      justifyContent: 'center',
    },

    confirmText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    disabledButton: {
      opacity: 0.65,
    },
  });


const bottomNavigationStyles =
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: MOBILE_BOTTOM_NAV_HEIGHT,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#EAE6F0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 4,
      zIndex: 30,
    },

    item: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },

    label: {
      fontSize: 10,
      color: '#6F6F6F',
      fontWeight: '600',
    },
  });


export default WeatherRecScreen;


















