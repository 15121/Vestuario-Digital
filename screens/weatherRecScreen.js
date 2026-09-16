import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
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

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';
import { MESSAGES } from '../theme/messages';

import {
  getWeatherByCity,
  getOutfitRecommendation,
} from '../services/weatherService';

import { getUserClothes } from '../services/database';


// ============================================================
// CONSTANTES
// ============================================================

// Ciudad utilizada para la primera carga.
// Se utiliza para que la pantalla tenga información inicial
// como en el mockup.
const DEFAULT_CITY = 'Buenos Aires';

// URL base de los íconos oficiales de OpenWeatherMap.
const WEATHER_ICON_URL = 'https://openweathermap.org/img/wn';


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Convierte el nombre de una condición de OpenWeather
 * en una descripción más amigable para la interfaz.
 */
const getConditionLabel = (weather) => {
  if (!weather) {
    return '';
  }

  if (weather.conditionDescription) {
    return (
      weather.conditionDescription.charAt(0).toUpperCase() +
      weather.conditionDescription.slice(1)
    );
  }

  switch (weather.conditionGroup) {
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

    default:
      return 'Condición climática';
  }
};


/**
 * Normaliza textos para poder comparar categorías,
 * colores, temporadas, títulos, etc.
 */
const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};


/**
 * Determina si una prenda parece ser superior.
 */
const isTopClothing = (item) => {
  const category = normalizeText(item.category);
  const title = normalizeText(item.title);

  return (
    category.includes('remera') ||
    category.includes('camisa') ||
    category.includes('blusa') ||
    category.includes('top') ||
    category.includes('musculosa') ||
    category.includes('buzo') ||
    category.includes('sweater') ||
    category.includes('campera') ||
    category.includes('abrigo') ||
    category.includes('saco') ||
    category.includes('chaqueta') ||
    title.includes('remera') ||
    title.includes('camisa') ||
    title.includes('blusa') ||
    title.includes('musculosa') ||
    title.includes('buzo') ||
    title.includes('sweater') ||
    title.includes('campera') ||
    title.includes('abrigo') ||
    title.includes('saco')
  );
};


/**
 * Determina si una prenda parece ser inferior.
 */
const isBottomClothing = (item) => {
  const category = normalizeText(item.category);
  const title = normalizeText(item.title);

  return (
    category.includes('pantalon') ||
    category.includes('jean') ||
    category.includes('falda') ||
    category.includes('short') ||
    category.includes('bermuda') ||
    category.includes('pollera') ||
    title.includes('pantalon') ||
    title.includes('jean') ||
    title.includes('falda') ||
    title.includes('short') ||
    title.includes('bermuda') ||
    title.includes('pollera')
  );
};


/**
 * Determina si una prenda corresponde a calzado.
 */
const isFootwear = (item) => {
  const category = normalizeText(item.category);
  const title = normalizeText(item.title);

  return (
    category.includes('calzado') ||
    category.includes('zapatilla') ||
    category.includes('zapato') ||
    category.includes('bota') ||
    category.includes('sandalia') ||
    title.includes('zapatilla') ||
    title.includes('zapato') ||
    title.includes('bota') ||
    title.includes('sandalia')
  );
};


/**
 * Determina si una prenda es de abrigo.
 */
const isWarmClothing = (item) => {
  const category = normalizeText(item.category);
  const title = normalizeText(item.title);
  const season = normalizeText(item.season);

  return (
    category.includes('abrigo') ||
    category.includes('campera') ||
    category.includes('saco') ||
    category.includes('buzo') ||
    category.includes('sweater') ||
    category.includes('chaleco') ||
    title.includes('campera') ||
    title.includes('abrigo') ||
    title.includes('saco') ||
    title.includes('buzo') ||
    title.includes('sweater') ||
    title.includes('chaleco') ||
    season.includes('invierno')
  );
};


/**
 * Determina si una prenda es liviana.
 */
const isLightClothing = (item) => {
  const category = normalizeText(item.category);
  const title = normalizeText(item.title);
  const season = normalizeText(item.season);

  return (
    category.includes('remera') ||
    category.includes('musculosa') ||
    category.includes('short') ||
    category.includes('bermuda') ||
    category.includes('vestido') ||
    category.includes('falda') ||
    title.includes('remera') ||
    title.includes('musculosa') ||
    title.includes('short') ||
    title.includes('bermuda') ||
    title.includes('vestido') ||
    title.includes('falda') ||
    season.includes('verano')
  );
};


/**
 * Devuelve un puntaje de compatibilidad de una prenda
 * con las condiciones climáticas actuales.
 *
 * No modifica la información almacenada en database.js.
 */
const getClothingScore = (item, weather) => {
  if (!weather) {
    return 0;
  }

  const temp = Number(weather.temp);
  const humidity = Number(weather.humidity);
  const condition = weather.conditionGroup;

  const isRain =
    condition === 'Rain' ||
    condition === 'Drizzle' ||
    condition === 'Thunderstorm';

  const isSnow = condition === 'Snow';

  let score = 0;

  // ----------------------------------------------------------
  // FRÍO
  // ----------------------------------------------------------
  if (temp <= 12) {
    if (isWarmClothing(item)) {
      score += 8;
    }

    if (isTopClothing(item)) {
      score += 2;
    }
  }

  // ----------------------------------------------------------
  // TEMPLADO
  // ----------------------------------------------------------
  if (temp > 12 && temp <= 22) {
    if (isTopClothing(item)) {
      score += 5;
    }

    if (isBottomClothing(item)) {
      score += 4;
    }

    if (isWarmClothing(item)) {
      score += 3;
    }
  }

  // ----------------------------------------------------------
  // CALOR
  // ----------------------------------------------------------
  if (temp > 22) {
    if (isLightClothing(item)) {
      score += 8;
    }

    if (isWarmClothing(item)) {
      score -= 4;
    }
  }

  // ----------------------------------------------------------
  // LLUVIA
  // ----------------------------------------------------------
  if (isRain) {
    const text = normalizeText(
      `${item.title} ${item.category} ${item.description}`
    );

    if (
      text.includes('impermeable') ||
      text.includes('piloto') ||
      text.includes('lluvia')
    ) {
      score += 10;
    }
  }

  // ----------------------------------------------------------
  // NIEVE
  // ----------------------------------------------------------
  if (isSnow) {
    if (isWarmClothing(item)) {
      score += 10;
    }
  }

  // ----------------------------------------------------------
  // HUMEDAD
  // ----------------------------------------------------------
  if (humidity >= 75 && temp > 22) {
    if (isLightClothing(item)) {
      score += 4;
    }

    if (isWarmClothing(item)) {
      score -= 3;
    }
  }

  // ----------------------------------------------------------
  // CALZADO
  // ----------------------------------------------------------
  if (isFootwear(item)) {
    if (isRain || isSnow) {
      score += 5;
    } else {
      score += 2;
    }
  }

  return score;
};


/**
 * Selecciona las prendas recomendadas.
 *
 * Intenta reproducir la estructura del mockup:
 * - una prenda superior
 * - una prenda inferior
 * - una tercera prenda, preferentemente abrigo
 *
 * Si el usuario tiene pocas prendas, devuelve las disponibles.
 */
const buildRecommendations = (clothes, weather) => {
  if (!Array.isArray(clothes) || clothes.length === 0 || !weather) {
    return [];
  }

  const sorted = [...clothes].sort(
    (a, b) =>
      getClothingScore(b, weather) -
      getClothingScore(a, weather)
  );

  const selected = [];

  // ----------------------------------------------------------
  // PRIMERA PRENDA: SUPERIOR
  // ----------------------------------------------------------
  const top = sorted.find(
    (item) =>
      isTopClothing(item) &&
      !selected.some((selectedItem) => selectedItem.id === item.id)
  );

  if (top) {
    selected.push(top);
  }

  // ----------------------------------------------------------
  // SEGUNDA PRENDA: INFERIOR
  // ----------------------------------------------------------
  const bottom = sorted.find(
    (item) =>
      isBottomClothing(item) &&
      !selected.some((selectedItem) => selectedItem.id === item.id)
  );

  if (bottom) {
    selected.push(bottom);
  }

  // ----------------------------------------------------------
  // TERCERA PRENDA
  // ----------------------------------------------------------
  //
  // Con clima templado/frío intentamos mostrar abrigo.
  // Con calor buscamos una prenda liviana.
  //
  let third;

  if (weather.temp <= 22) {
    third = sorted.find(
      (item) =>
        isWarmClothing(item) &&
        !selected.some((selectedItem) => selectedItem.id === item.id)
    );
  }

  if (!third && weather.temp > 22) {
    third = sorted.find(
      (item) =>
        isLightClothing(item) &&
        !selected.some((selectedItem) => selectedItem.id === item.id)
    );
  }

  if (!third) {
    third = sorted.find(
      (item) =>
        !selected.some((selectedItem) => selectedItem.id === item.id)
    );
  }

  if (third) {
    selected.push(third);
  }

  // ----------------------------------------------------------
  // SI NO HAY UNA COMBINACIÓN COMPLETA
  // COMPLETAMOS CON LAS MEJORES PRENDAS DISPONIBLES
  // ----------------------------------------------------------
  sorted.forEach((item) => {
    if (selected.length >= 3) {
      return;
    }

    if (!selected.some((selectedItem) => selectedItem.id === item.id)) {
      selected.push(item);
    }
  });

  return selected.slice(0, 3);
};


// ============================================================
// COMPONENTE: ICONO DE COLOR
// ============================================================

function ColorDot({ color }) {
  const normalizedColor = normalizeText(color);

  let backgroundColor = '#D8D8D8';

  const colorMap = {
    blanco: '#FFFFFF',
    negro: '#161616',
    azul: '#4169E1',
    rojo: '#E53935',
    verde: '#43A047',
    amarillo: '#FDD835',
    naranja: '#FB8C00',
    violeta: '#8E44AD',
    morado: '#8E44AD',
    rosa: '#EC407A',
    gris: '#8A8A8A',
    marron: '#795548',
    beige: '#D7C3A5',
    celeste: '#64B5F6',
  };

  Object.keys(colorMap).forEach((key) => {
    if (normalizedColor.includes(key)) {
      backgroundColor = colorMap[key];
    }
  });

  return (
    <View
      style={[
        styles.colorDot,
        {
          backgroundColor,
          borderColor:
            normalizedColor.includes('blanco')
              ? '#D9D9D9'
              : backgroundColor,
        },
      ]}
    />
  );
}


// ============================================================
// COMPONENTE: TARJETA DE PRENDA
// ============================================================

function ClothingRecommendationCard({ item, isDesktop }) {
  const imageUri = item?.imageUri;

  return (
    <View
      style={[
        styles.clothingCard,
        isDesktop && styles.clothingCardDesktop,
      ]}
    >
      {/* Imagen */}
      <View
        style={[
          styles.clothingImageContainer,
          isDesktop && styles.clothingImageContainerDesktop,
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.clothingImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="shirt-outline"
              size={38}
              color={COLORS.icon}
            />
          </View>
        )}
      </View>

      {/* Información */}
      <View style={styles.clothingInfo}>
        <Text
          style={styles.clothingTitle}
          numberOfLines={2}
        >
          {item.title || 'Prenda sin nombre'}
        </Text>

        <Text style={styles.clothingCategory}>
          Categoría: {item.category || 'Sin categoría'}
        </Text>

        <View style={styles.colorRow}>
          <ColorDot color={item.color} />

          <Text style={styles.colorText}>
            {item.color || 'Sin color'}
          </Text>
        </View>
      </View>

      {/* Selector visual */}
      <View style={styles.recommendationCircle} />
    </View>
  );
}


// ============================================================
// COMPONENTE: TARJETA DEL CLIMA
// ============================================================

function WeatherCard({
  weather,
  onChangeCity,
  isDesktop,
}) {
  if (!weather) {
    return null;
  }

  const iconUri = `${WEATHER_ICON_URL}/${weather.iconCode}@2x.png`;

  return (
    <View
      style={[
        styles.weatherCard,
        isDesktop && styles.weatherCardDesktop,
      ]}
    >
      {/* Encabezado de la tarjeta */}
      <View style={styles.weatherHeader}>
        <View style={styles.cityContainer}>
          <Ionicons
            name="location-outline"
            size={30}
            color={COLORS.icon}
          />

          <Text style={styles.cityText}>
            {weather.city}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.changeCityButton}
          onPress={onChangeCity}
          activeOpacity={0.8}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color="#FFFFFF"
          />

          <Text style={styles.changeCityText}>
            Cambiar ciudad
          </Text>
        </TouchableOpacity>
      </View>

      {/* Información principal */}
      <View
        style={[
          styles.weatherMain,
          isDesktop && styles.weatherMainDesktop,
        ]}
      >
        <Image
          source={{ uri: iconUri }}
          style={[
            styles.weatherIcon,
            isDesktop && styles.weatherIconDesktop,
          ]}
          resizeMode="contain"
        />

        <View style={styles.temperatureContainer}>
          <Text
            style={[
              styles.temperature,
              isDesktop && styles.temperatureDesktop,
            ]}
          >
            {weather.temp}°C
          </Text>

          <Text style={styles.conditionText}>
            {getConditionLabel(weather)}
          </Text>
        </View>
      </View>

      {/* Sensación térmica */}
      <View style={styles.feelsLikeContainer}>
        <View style={styles.feelsLikeIcon}>
          <Ionicons
            name="thermometer-outline"
            size={27}
            color={COLORS.icon}
          />
        </View>

        <Text style={styles.feelsLikeLabel}>
          Sensación térmica
        </Text>

        <Text style={styles.feelsLikeValue}>
          {weather.feelsLike}°C
        </Text>
      </View>
    </View>
  );
}


// ============================================================
// COMPONENTE: MODAL CAMBIAR CIUDAD
// ============================================================

function ChangeCityModal({
  visible,
  city,
  setCity,
  onClose,
  onSearch,
  loading,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable
          style={styles.cityModal}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Cambiar ciudad
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={25}
                color={COLORS.textDark}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Ingresá una ciudad para consultar el clima actual.
          </Text>

          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Ej. Buenos Aires"
            placeholderTextColor="#9A8CA1"
            style={styles.cityInput}
            autoFocus={Platform.OS !== 'web'}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />

          <TouchableOpacity
            style={styles.modalSearchButton}
            onPress={onSearch}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.modalSearchText}>
                  Consultar clima
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function WeatherRecScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  // Usuario recibido desde MainTabNavigator.
  const user = route?.params?.user;

  // ----------------------------------------------------------
  // ESTADOS
  // ----------------------------------------------------------

  const [weather, setWeather] = useState(null);

  const [clothes, setClothes] = useState([]);

  const [recommendations, setRecommendations] = useState([]);

  const [loadingWeather, setLoadingWeather] = useState(false);

  const [loadingClothes, setLoadingClothes] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [cityInput, setCityInput] = useState(DEFAULT_CITY);

  const [cityModalVisible, setCityModalVisible] = useState(false);


  // ==========================================================
  // CARGAR PRENDAS DEL USUARIO
  // ==========================================================

  const loadUserClothes = useCallback(async () => {
    if (!user?.id) {
      setClothes([]);
      return [];
    }

    try {
      setLoadingClothes(true);

      const userClothes = await getUserClothes(user.id);

      const clothesArray = Array.isArray(userClothes)
        ? userClothes
        : [];

      setClothes(clothesArray);

      return clothesArray;
    } catch (error) {
      console.log(
        'Error al cargar prendas para recomendación:',
        error
      );

      setClothes([]);

      return [];
    } finally {
      setLoadingClothes(false);
    }
  }, [user?.id]);


  // ==========================================================
  // CONSULTAR CLIMA
  // ==========================================================

  const loadWeather = useCallback(
    async (requestedCity = DEFAULT_CITY) => {
      const cleanCity = requestedCity.trim();

      if (!cleanCity) {
        setErrorMessage(
          'Ingresá una ciudad para consultar el clima.'
        );
        return;
      }

      try {
        setLoadingWeather(true);
        setErrorMessage('');

        const weatherData = await getWeatherByCity(
          cleanCity
        );

        setWeather(weatherData);

        setCityInput(weatherData.city);

        // ----------------------------------------------------
        // Obtener prendas actualizadas
        // ----------------------------------------------------
        let currentClothes = clothes;

        if (user?.id) {
          currentClothes = await loadUserClothes();
        }

        // ----------------------------------------------------
        // Generar recomendaciones
        // ----------------------------------------------------
        const recommended = buildRecommendations(
          currentClothes,
          weatherData
        );

        setRecommendations(recommended);
      } catch (error) {
        console.log(
          'Error al obtener recomendación climática:',
          error
        );

        if (
          error?.message ===
          'Ciudad no encontrada. Verifica el nombre ingresado.'
        ) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            error?.message || MESSAGES.NETWORK_ERROR
          );
        }
      } finally {
        setLoadingWeather(false);
      }
    },
    [clothes, loadUserClothes, user?.id]
  );


  // ==========================================================
  // PRIMERA ENTRADA
  // ==========================================================

  useEffect(() => {
    loadUserClothes();
  }, [loadUserClothes]);


  useEffect(() => {
    loadWeather(DEFAULT_CITY);
  }, []);


  // ==========================================================
  // ACTUALIZAR RECOMENDACIONES
  // ==========================================================

  const handleRefresh = async () => {
    const currentCity =
      weather?.city?.split(',')[0] ||
      cityInput ||
      DEFAULT_CITY;

    await loadWeather(currentCity);
  };


  // ==========================================================
  // CAMBIAR CIUDAD
  // ==========================================================

  const handleChangeCity = () => {
    setCityInput(
      weather?.city?.split(',')[0] ||
      DEFAULT_CITY
    );

    setCityModalVisible(true);
  };


  const handleSearchCity = async () => {
    Keyboard.dismiss();

    const cleanCity = cityInput.trim();

    if (!cleanCity) {
      setErrorMessage(
        'Ingresá una ciudad para consultar el clima.'
      );
      return;
    }

    setCityModalVisible(false);

    await loadWeather(cleanCity);
  };


  // ==========================================================
  // TEXTO DE ESTADO
  // ==========================================================

  const emptyClothesMessage = useMemo(() => {
    if (!user?.id) {
      return 'Iniciá sesión para obtener recomendaciones utilizando las prendas de tu armario.';
    }

    if (loadingClothes) {
      return 'Cargando las prendas de tu armario...';
    }

    return 'Todavía no tenés prendas registradas en tu armario. Agregá prendas para recibir recomendaciones.';
  }, [
    user?.id,
    loadingClothes,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View style={styles.root}>

      {/* ======================================================
          HEADER
          ====================================================== */}

      {!isDesktop && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons
              name="arrow-back"
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text
            style={styles.mobileHeaderTitle}
            numberOfLines={1}
          >
            Recomendación Climática
          </Text>

          <View style={styles.headerSpacer} />
        </View>
      )}


      {/* ======================================================
          CONTENIDO
          ====================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.contentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------
            ERROR
            ---------------------------------------------------- */}

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={COLORS.buttonDark}
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}


        {/* ====================================================
            LAYOUT DESKTOP
            ==================================================== */}

        {isDesktop ? (
          <View style={styles.desktopColumns}>

            {/* ------------------------------------------------
                COLUMNA IZQUIERDA
                ------------------------------------------------ */}

            <View style={styles.leftColumn}>
              {loadingWeather && !weather ? (
                <View style={styles.loadingWeatherCard}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                  />

                  <Text style={styles.loadingText}>
                    Consultando clima...
                  </Text>
                </View>
              ) : (
                <WeatherCard
                  weather={weather}
                  onChangeCity={handleChangeCity}
                  isDesktop
                />
              )}
            </View>


            {/* ------------------------------------------------
                COLUMNA DERECHA
                ------------------------------------------------ */}

            <View style={styles.rightColumn}>

              {/* Título */}
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons
                    name="shirt-outline"
                    size={25}
                    color={COLORS.icon}
                  />
                </View>

                <Text style={styles.sectionTitle}>
                  Prendas recomendadas para hoy
                </Text>
              </View>


              {/* Prendas */}
              {recommendations.length > 0 ? (
                <View style={styles.recommendationsList}>
                  {recommendations.map((item) => (
                    <ClothingRecommendationCard
                      key={String(item.id)}
                      item={item}
                      isDesktop
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyClothesContainer}>
                  <Ionicons
                    name="shirt-outline"
                    size={42}
                    color={COLORS.icon}
                  />

                  <Text style={styles.emptyClothesTitle}>
                    Sin prendas para recomendar
                  </Text>

                  <Text style={styles.emptyClothesText}>
                    {emptyClothesMessage}
                  </Text>
                </View>
              )}


              {/* Aviso */}
              <InfoBox />


              {/* Actualizar */}
              <RefreshButton
                onPress={handleRefresh}
                loading={loadingWeather}
              />

            </View>
          </View>
        ) : (

          /* ==================================================
             LAYOUT MOBILE
             ================================================== */

          <View style={styles.mobileContent}>

            {/* ------------------------------------------------
                CLIMA
                ------------------------------------------------ */}

            {loadingWeather && !weather ? (
              <View style={styles.loadingWeatherCard}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                />

                <Text style={styles.loadingText}>
                  Consultando clima...
                </Text>
              </View>
            ) : (
              <WeatherCard
                weather={weather}
                onChangeCity={handleChangeCity}
                isDesktop={false}
              />
            )}


            {/* ------------------------------------------------
                TÍTULO PRENDAS
                ------------------------------------------------ */}

            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="shirt-outline"
                  size={25}
                  color={COLORS.icon}
                />
              </View>

              <Text style={styles.sectionTitle}>
                Prendas recomendadas para hoy
              </Text>
            </View>


            {/* ------------------------------------------------
                RECOMENDACIONES
                ------------------------------------------------ */}

            {recommendations.length > 0 ? (
              <View style={styles.recommendationsList}>
                {recommendations.map((item) => (
                  <ClothingRecommendationCard
                    key={String(item.id)}
                    item={item}
                    isDesktop={false}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyClothesContainer}>
                <Ionicons
                  name="shirt-outline"
                  size={42}
                  color={COLORS.icon}
                />

                <Text style={styles.emptyClothesTitle}>
                  Sin prendas para recomendar
                </Text>

                <Text style={styles.emptyClothesText}>
                  {emptyClothesMessage}
                </Text>
              </View>
            )}


            {/* ------------------------------------------------
                AVISO
                ------------------------------------------------ */}

            <InfoBox />


            {/* ------------------------------------------------
                ACTUALIZAR
                ------------------------------------------------ */}

            <RefreshButton
              onPress={handleRefresh}
              loading={loadingWeather}
            />

          </View>
        )}
      </ScrollView>


      {/* ======================================================
          MODAL CAMBIAR CIUDAD
          ====================================================== */}

      <ChangeCityModal
        visible={cityModalVisible}
        city={cityInput}
        setCity={setCityInput}
        onClose={() => setCityModalVisible(false)}
        onSearch={handleSearchCity}
        loading={loadingWeather}
      />

    </View>
  );
}


// ============================================================
// COMPONENTE: AVISO INFORMATIVO
// ============================================================

function InfoBox() {
  return (
    <View style={styles.infoBox}>
      <View style={styles.infoIconContainer}>
        <Ionicons
          name="information-circle-outline"
          size={25}
          color={COLORS.buttonDark}
        />
      </View>

      <Text style={styles.infoText}>
        Estas recomendaciones se generan utilizando las prendas
        que tenés registradas en tu armario.
      </Text>
    </View>
  );
}


// ============================================================
// COMPONENTE: BOTÓN ACTUALIZAR
// ============================================================

function RefreshButton({
  onPress,
  loading,
}) {
  return (
    <TouchableOpacity
      style={styles.refreshButton}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color="#FFFFFF"
          size="small"
        />
      ) : (
        <Ionicons
          name="refresh-outline"
          size={28}
          color="#FFFFFF"
        />
      )}

      <Text style={styles.refreshButtonText}>
        Actualizar recomendaciones
      </Text>
    </TouchableOpacity>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // GENERAL
  // ==========================================================

  root: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  contentDesktop: {
    paddingHorizontal: 42,
    paddingVertical: 38,
  },


  // ==========================================================
  // HEADER MOBILE
  // ==========================================================

  mobileHeader: {
    height: 82,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  mobileHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_400Regular',
  },

  headerSpacer: {
    width: 48,
  },


  // ==========================================================
  // ERROR
  // ==========================================================

  errorContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4E8FC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },

  errorText: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // DESKTOP
  // ==========================================================

  desktopColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 56,
    width: '100%',
  },

  leftColumn: {
    flex: 1,
    minWidth: 420,
    maxWidth: 720,
  },

  rightColumn: {
    flex: 1,
    minWidth: 480,
    maxWidth: 720,
  },


  // ==========================================================
  // WEATHER CARD
  // ==========================================================

  weatherCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 0,

    shadowColor: '#8C6BA7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,

    borderWidth: 1,
    borderColor: '#F0EAF5',
  },

  weatherCardDesktop: {
    minHeight: 350,
  },

  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },

  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },

  cityText: {
    color: COLORS.textDark,
    fontSize: 21,
    fontFamily: 'Poppins_600SemiBold',
    flexShrink: 1,
  },

  changeCityButton: {
    minHeight: 45,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: COLORS.buttonDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  changeCityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },


  // ==========================================================
  // WEATHER MAIN
  // ==========================================================

  weatherMain: {
    minHeight: 185,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },

  weatherMainDesktop: {
    minHeight: 210,
  },

  weatherIcon: {
    width: 145,
    height: 125,
  },

  weatherIconDesktop: {
    width: 175,
    height: 150,
  },

  temperatureContainer: {
    justifyContent: 'center',
  },

  temperature: {
    color: COLORS.buttonDark,
    fontSize: 58,
    lineHeight: 66,
    fontFamily: 'Poppins_400Regular',
  },

  temperatureDesktop: {
    fontSize: 64,
  },

  conditionText: {
    color: COLORS.textDark,
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },


  // ==========================================================
  // FEELS LIKE
  // ==========================================================

  feelsLikeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EFE9F3',
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },

  feelsLikeIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F5ECFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  feelsLikeLabel: {
    color: COLORS.textDark,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },

  feelsLikeValue: {
    color: COLORS.textDark,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // LOADING
  // ==========================================================

  loadingWeatherCard: {
    minHeight: 350,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F0EAF5',
  },

  loadingText: {
    color: COLORS.textLight,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // SECCIÓN PRENDAS
  // ==========================================================

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 14,
  },

  sectionIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F5ECFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold',
  },


  // ==========================================================
  // LISTA DE RECOMENDACIONES
  // ==========================================================

  recommendationsList: {
    gap: 12,
  },


  // ==========================================================
  // TARJETA PRENDA
  // ==========================================================

  clothingCard: {
    width: '100%',
    minHeight: 132,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0EAF5',

    flexDirection: 'row',
    alignItems: 'center',

    padding: 12,

    shadowColor: '#8C6BA7',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },

  clothingCardDesktop: {
    minHeight: 142,
  },

  clothingImageContainer: {
    width: 125,
    height: 105,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  clothingImageContainerDesktop: {
    width: 120,
    height: 110,
  },

  clothingImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clothingInfo: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  clothingTitle: {
    color: COLORS.textDark,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: 'Poppins_600SemiBold',
  },

  clothingCategory: {
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },

  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 9,
  },

  colorDot: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
  },

  colorText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  recommendationCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7EF',
    marginLeft: 5,
  },


  // ==========================================================
  // SIN PRENDAS
  // ==========================================================

  emptyClothesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0EAF5',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyClothesTitle: {
    color: COLORS.textDark,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 10,
    textAlign: 'center',
  },

  emptyClothesText: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 500,
  },


  // ==========================================================
  // INFO BOX
  // ==========================================================

  infoBox: {
    width: '100%',
    minHeight: 72,
    marginTop: 18,
    backgroundColor: '#F5ECFB',
    borderRadius: 15,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 12,
  },

  infoIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    flex: 1,
    color: COLORS.buttonDark,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },


  // ==========================================================
  // BOTÓN ACTUALIZAR
  // ==========================================================

  refreshButton: {
    width: '100%',
    minHeight: 64,
    marginTop: 18,

    borderRadius: 16,
    backgroundColor: COLORS.buttonDark,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 12,

    shadowColor: '#764DC6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_500Medium',
  },


  // ==========================================================
  // MODAL CAMBIAR CIUDAD
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 25, 50, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  cityModal: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    color: COLORS.textDark,
    fontSize: 21,
    fontFamily: 'Poppins_600SemiBold',
  },

  modalDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 18,
    fontFamily: 'Poppins_400Regular',
  },

  cityInput: {
    width: '100%',
    height: 52,
    backgroundColor: '#F8F3FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6DCEF',

    paddingHorizontal: 15,

    color: COLORS.textDark,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },

  modalSearchButton: {
    height: 52,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: COLORS.buttonDark,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 9,
  },

  modalSearchText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },


  // ==========================================================
  // MOBILE
  // ==========================================================

  mobileContent: {
    width: '100%',
  },
});