import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
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

import {
  getWeatherByCity,
  getOutfitAdvice,
} from '../services/weatherService';

import {
  addHistoryEntry,
  addOutfit,
  getUserClothes,
  getUserHistory,
} from '../services/database';

import {
  getUserCity,
  saveUserCity,
} from '../services/weatherStorage';

import {
  AppHeader,
  DesktopSidebar,
  MobileAddButton,
} from '../navigation/MainTabNavigator';

import AddMenuModal from '../components/AddMenuModal';
import SideMenu from '../components/sideMenu';
import { confirmLogout } from '../services/session';
import { getColorHex } from '../utils/colorutils';
import {
  buildOutfitOptions,
  buildLayerSuggestions,
} from '../utils/outfitrecommender';
import { getRestOfDayForecast } from '../services/forecastService';


// ============================================================
// CONSTANTES
// ============================================================

const WEATHER_ICON_URL =
  'https://openweathermap.org/img/wn';

const DESKTOP_BREAKPOINT = 900;

const MOBILE_BOTTOM_NAV_HEIGHT = 78;


// ============================================================
// UTILIDADES
// ============================================================

const getUserIdentifier = (user) => {
  return (
    user?.id ??
    user?.id_usuario ??
    null
  );
};


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


const getItemId = (item, index = 0) => {
  return (
    item?.id ??
    item?.id_prenda ??
    item?.idClothing ??
    `clothing-${index}`
  );
};


// ============================================================
// TEXTO DEL CLIMA
// ============================================================

const getConditionLabel = (
  weather
) => {
  if (!weather) {
    return '';
  }

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
      String(
        weather.conditionDescription
      );

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
// TARJETA DEL CLIMA
// ============================================================

const WeatherCard = ({
  weather,
  onChangeCity,
}) => {
  const iconCode =
    weather?.iconCode;

  const isWindy =
    weather?.weatherIconType === 'wind' ||
    weather?.isWindy === true;

  const weatherIconUri =
    iconCode
      ? `${WEATHER_ICON_URL}/${iconCode}@2x.png`
      : null;

  return (
    <View
      style={weatherCardStyles.card}
    >
      <View
        style={weatherCardStyles.topRow}
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
              {weather?.city ||
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
            Cambiar
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
            {weather?.temp ?? '--'}°C
          </Text>

          <Text
            style={
              weatherCardStyles.condition
            }
          >
            {getConditionLabel(
              weather
            )}
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
        <WeatherInfo
          icon="thermometer-outline"
          label="Sensación"
          value={
            weather?.feelsLike !==
              undefined &&
            weather?.feelsLike !==
              null
              ? `${weather.feelsLike}°C`
              : '--'
          }
        />

        {weather?.humidity !==
          undefined &&
          weather?.humidity !==
            null && (
            <WeatherInfo
              icon="water-outline"
              label="Humedad"
              value={`${weather.humidity}%`}
            />
          )}

        {weather?.windSpeedKmh !==
          undefined &&
          weather?.windSpeedKmh !==
            null && (
            <WeatherInfo
              icon="weather-windy"
              label="Viento"
              value={`${Math.round(
                Number(
                  weather.windSpeedKmh
                )
              )} km/h`}
              material
            />
          )}
      </View>
    </View>
  );
};


const WeatherInfo = ({
  icon,
  label,
  value,
  material = false,
}) => {
  return (
    <View
      style={
        weatherCardStyles.infoItem
      }
    >
      {material ? (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color="#8C73D6"
        />
      ) : (
        <Ionicons
          name={icon}
          size={18}
          color="#8C73D6"
        />
      )}

      <Text
        style={
          weatherCardStyles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          weatherCardStyles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
};


// ============================================================
// COLOR DE PRENDA
// ============================================================

const getClothingColorDot = (colorName) =>
  getColorHex(colorName, '#CBD5E1');


// ============================================================
// TARJETA DE PRENDA
// ============================================================

const ClothingRecommendationCard = ({
  item,
  label,
  reason,
}) => {
  const title =
    getClothingTitle(item);

  const category =
    getClothingCategory(item);

  const color =
    getClothingColor(item);

  const image =
    getClothingImage(item);

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
            resizeMode="contain"
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
        {label ? (
          <Text
            style={
              recommendationStyles.slotLabel
            }
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}

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
                backgroundColor:
                  getClothingColorDot(
                    color
                  ),
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

        {reason ? (
          <Text
            style={
              recommendationStyles.reason
            }
            numberOfLines={2}
          >
            {reason}
          </Text>
        ) : null}
      </View>
    </View>
  );
};


// ============================================================
// SELECTOR DE OUTFITS (Opción 1 / 2 / 3)
// ============================================================

const OutfitSelector = ({
  outfits,
  selected,
  onSelect,
}) => {
  if (!Array.isArray(outfits) || outfits.length < 2) {
    return null;
  }

  return (
    <View style={optionStyles.selectorRow}>
      {outfits.map((outfit, index) => {
        const active = index === selected;

        return (
          <TouchableOpacity
            key={outfit.id}
            activeOpacity={0.85}
            onPress={() => onSelect(index)}
            style={[
              optionStyles.chip,
              active && optionStyles.chipActive,
            ]}
          >
            <Ionicons
              name={active ? 'sparkles' : 'sparkles-outline'}
              size={14}
              color={active ? '#FFFFFF' : '#8C73D6'}
            />

            <Text
              style={[
                optionStyles.chipText,
                active && optionStyles.chipTextActive,
              ]}
            >
              {outfit.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


// ============================================================
// OTRAS OPCIONES PARA UNA PARTE DEL OUTFIT
// ============================================================

const AlternativesRow = ({
  slot,
  currentId,
  options,
  onPick,
}) => {
  const others = (options || []).filter(
    (entry) => String(entry.id) !== String(currentId)
  );

  if (others.length === 0) {
    return null;
  }

  return (
    <View style={optionStyles.altContainer}>
      <Text style={optionStyles.altTitle}>
        Otras opciones
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={optionStyles.altList}
      >
        {others.map((entry) => {
          const image = getClothingImage(entry.item);

          return (
            <TouchableOpacity
              key={`${slot}-${entry.id}`}
              activeOpacity={0.8}
              onPress={() => onPick(slot, entry)}
              style={optionStyles.altItem}
            >
              <View style={optionStyles.altImageBox}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={optionStyles.altImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="shirt-outline"
                    size={20}
                    color="#A8A8A8"
                  />
                )}
              </View>

              <Text
                style={optionStyles.altName}
                numberOfLines={1}
              >
                {getClothingTitle(entry.item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};


// ============================================================
// SUGERENCIA PARA MÁS TARDE (capas)
// ============================================================

const LayerSuggestionCard = ({
  suggestion,
}) => {
  const image = suggestion.item
    ? getClothingImage(suggestion.item)
    : null;

  return (
    <View style={optionStyles.layerCard}>
      <View style={optionStyles.layerIcon}>
        <Ionicons
          name={suggestion.icon || 'time-outline'}
          size={20}
          color="#8C73D6"
        />
      </View>

      <View style={optionStyles.layerContent}>
        <Text style={optionStyles.layerLabel}>
          {suggestion.label}
        </Text>

        {suggestion.item ? (
          <Text
            style={optionStyles.layerTitle}
            numberOfLines={1}
          >
            Sumá: {getClothingTitle(suggestion.item)}
          </Text>
        ) : null}

        <Text style={optionStyles.layerReason}>
          {suggestion.reason}
        </Text>
      </View>

      {image ? (
        <Image
          source={{ uri: image }}
          style={optionStyles.layerImage}
          resizeMode="contain"
        />
      ) : null}
    </View>
  );
};


// ============================================================
// ESTADO VACÍO
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
          ? 'No hay prendas adecuadas para este clima.'
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
// MODAL CIUDAD
// ============================================================

// ============================================================
// MODAL: GUARDAR OUTFIT RECOMENDADO
// ============================================================

const SaveOutfitModal = ({
  visible,
  mode,
  name,
  setName,
  saving,
  onConfirm,
  onClose,
}) => {
  const useToday = mode === 'today';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={saveStyles.overlay} onPress={onClose}>
        <Pressable
          style={saveStyles.modal}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={saveStyles.header}>
            <Text style={saveStyles.title}>
              {useToday ? 'Me lo pongo hoy' : 'Guardar outfit'}
            </Text>

            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Ionicons name="close" size={24} color="#302B3B" />
            </TouchableOpacity>
          </View>

          <Text style={saveStyles.description}>
            {useToday
              ? 'Lo guardamos en tus outfits y lo registramos como usado hoy.'
              : 'Se va a guardar en tus outfits con este nombre.'}
          </Text>

          <Text style={saveStyles.label}>Nombre del outfit</Text>

          <TextInput
            value={name}
            onChangeText={(text) => setName(text.slice(0, 60))}
            style={saveStyles.input}
            placeholder="Ej. Look casual"
            placeholderTextColor="#A99AAF"
            maxLength={60}
            editable={!saving}
          />

          <View style={saveStyles.buttons}>
            <TouchableOpacity
              style={saveStyles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={saveStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                saveStyles.confirmButton,
                (saving || !name.trim()) && saveStyles.disabled,
              ]}
              onPress={onConfirm}
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={saveStyles.confirmText}>
                  {useToday ? 'Guardar y usar hoy' : 'Guardar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


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
              disabled={loading}
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
            autoCorrect={false}
            returnKeyType="done"
            editable={!loading}
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
              disabled={loading}
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
// PANTALLA PRINCIPAL
// ============================================================

const WeatherRecScreen = ({
  navigation,
  route,
}) => {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width >= DESKTOP_BREAKPOINT;

  const user =
    route?.params?.user ||
    null;

  const userId = useMemo(
    () =>
      getUserIdentifier(user),
    [user]
  );


  // ----------------------------------------------------------
  // ESTADOS
  // ----------------------------------------------------------

  const [weather, setWeather] =
    useState(null);

  const [clothes, setClothes] =
    useState([]);

  // Outfits completos para el clima de hoy (hasta 3).
  // Cada uno: { id, name, items: [{ item, id, slot, label, reason }] }
  const [outfitOptions, setOutfitOptions] =
    useState([]);

  // Otras prendas posibles para cada parte del outfit.
  const [alternatives, setAlternatives] =
    useState({});

  // Outfit elegido (0, 1 o 2).
  const [selectedOutfit, setSelectedOutfit] =
    useState(0);

  // Prendas que el usuario cambió a mano: { slot: recomendación }
  const [swaps, setSwaps] =
    useState({});

  // Pronóstico por hora del resto del día (para las capas).
  const [dayHours, setDayHours] =
    useState([]);

  // Qué le falta al usuario para completar el outfit.
  const [missingItems, setMissingItems] =
    useState([]);

  const [city, setCity] =
    useState('');

  const [cityInput, setCityInput] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [loadingWeather, setLoadingWeather] =
    useState(false);

  const [refreshingRecommendations, setRefreshingRecommendations] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [cityModalVisible, setCityModalVisible] =
    useState(false);

  const [sideMenuVisible, setSideMenuVisible] =
    useState(false);

  const [addMenuVisible, setAddMenuVisible] =
    useState(false);


  // ----------------------------------------------------------
  // CONSEJO GENERAL DE VESTIMENTA
  // ----------------------------------------------------------
  //
  // IMPORTANTE: los hooks deben ir antes de cualquier return
  // condicional (como el de "loading" más abajo).

  const advice = useMemo(() => {
    if (!weather) {
      return null;
    }

    return getOutfitAdvice({
      temp: weather.temp,
      feelsLike: weather.feelsLike,
      conditionGroup: weather.conditionGroup,
      humidity: weather.humidity,
      windSpeedMs: weather.windSpeedMs,
      isWindy: weather.isWindy,
    });
  }, [weather]);


  // ----------------------------------------------------------
  // OUTFIT QUE SE MUESTRA (con los cambios del usuario)
  // ----------------------------------------------------------

  const recommendations = useMemo(() => {
    const outfit =
      outfitOptions[selectedOutfit] ||
      outfitOptions[0];

    if (!outfit) {
      return [];
    }

    return outfit.items.map((entry) =>
      swaps[entry.slot] &&
      entry.slot !== 'accessory'
        ? swaps[entry.slot]
        : entry
    );
  }, [outfitOptions, selectedOutfit, swaps]);


  // ----------------------------------------------------------
  // CAPAS PARA MÁS TARDE
  // ----------------------------------------------------------

  const layerSuggestions = useMemo(() => {
    if (!weather || dayHours.length === 0) {
      return [];
    }

    return buildLayerSuggestions(
      clothes,
      weather,
      dayHours,
      recommendations
    );
  }, [weather, clothes, dayHours, recommendations]);


  const handleSelectOutfit = useCallback((index) => {
    setSelectedOutfit(index);
    setSwaps({});
  }, []);


  const handleSwap = useCallback((slot, entry) => {
    setSwaps((current) => ({
      ...current,
      [slot]: entry,
    }));
  }, []);


  // ----------------------------------------------------------
  // GUARDAR OUTFIT RECOMENDADO / ME LO PONGO HOY
  // ----------------------------------------------------------
  //
  // Usa las mismas funciones que "Crear outfit" (addOutfit y
  // addHistoryEntry). No cambia la estructura de la base.

  // Outfits ya guardados en esta sesión: { combinación: id }
  const [savedOutfits, setSavedOutfits] = useState({});
  const [saveModal, setSaveModal] = useState(null); // 'save' | 'today' | null
  const [saveName, setSaveName] = useState('');
  const [savingOutfit, setSavingOutfit] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Arma la estructura { superior, inferior, calzado, accesorios }
  const outfitToSave = useMemo(() => {
    const bySlot = (slot) =>
      recommendations.find((entry) => entry.slot === slot)?.item;

    const onepiece = bySlot('onepiece');
    const upper = onepiece || bySlot('top');
    const lower = onepiece ? null : bySlot('bottom');
    const shoes = bySlot('footwear');

    // El abrigo no tiene lugar propio en un outfit:
    // se guarda junto con los accesorios.
    const extras = recommendations
      .filter((entry) => entry.slot === 'outer' || entry.slot === 'accessory')
      .map((entry) => entry.item?.id)
      .filter((id) => id !== null && id !== undefined);

    const complete = Boolean(upper && shoes && (onepiece || lower));

    const items = {
      superior: upper?.id ?? null,
      inferior: lower?.id ?? null,
      calzado: shoes?.id ?? null,
      accesorios: extras,
    };

    return {
      complete,
      items,
      key: [items.superior, items.inferior, items.calzado, ...extras].join('-'),
    };
  }, [recommendations]);

  const savedId = savedOutfits[outfitToSave.key];

  // Si cambia el outfit que se ve, el mensaje anterior ya no aplica.
  useEffect(() => {
    setSaveMessage(null);
  }, [outfitToSave.key]);

  const openSaveModal = useCallback(
    (mode) => {
      const temp = weather ? Math.round(Number(weather.feelsLike ?? weather.temp)) : null;
      const now = new Date();
      const date = `${now.getDate()}/${now.getMonth() + 1}`;

      setSaveName(
        Number.isFinite(temp) ? `Look ${temp}°C · ${date}` : `Look del ${date}`
      );
      setSaveModal(mode);
    },
    [weather]
  );

  const markAsUsedToday = useCallback(
    async (outfitId, outfitName) => {
      const history = await getUserHistory(userId);
      const today = new Date().toDateString();

      const alreadyUsed = (Array.isArray(history) ? history : []).some(
        (entry) =>
          String(entry.outfitId) === String(outfitId) &&
          new Date(entry.date).toDateString() === today
      );

      if (alreadyUsed) {
        return 'already';
      }

      const result = await addHistoryEntry({
        userId,
        outfitId,
        outfitName,
        imageUri: '',
        note: '',
      });

      return result?.success ? 'ok' : 'error';
    },
    [userId]
  );

  // "Me lo pongo hoy" sobre un outfit que ya se guardó: no
  // hace falta pedir el nombre otra vez.
  const handleUseSavedToday = useCallback(async () => {
    if (!savedId) return;

    setSavingOutfit(true);

    try {
      const status = await markAsUsedToday(savedId.id, savedId.name);

      setSaveMessage(
        status === 'already'
          ? { type: 'info', text: 'Este outfit ya está registrado como usado hoy.' }
          : status === 'ok'
            ? { type: 'ok', text: '¡Listo! Lo registramos en tu historial de hoy.' }
            : { type: 'error', text: 'No se pudo registrar el uso. Probá de nuevo.' }
      );
    } catch (error) {
      console.log('Error registrando uso:', error);
      setSaveMessage({ type: 'error', text: 'No se pudo registrar el uso. Probá de nuevo.' });
    } finally {
      setSavingOutfit(false);
    }
  }, [savedId, markAsUsedToday]);

  const handleConfirmSave = useCallback(async () => {
    const name = saveName.trim();

    if (!name || !outfitToSave.complete || userId === null || userId === undefined) {
      return;
    }

    setSavingOutfit(true);

    try {
      const result = await addOutfit({
        userId,
        name,
        description: 'Creado desde la recomendación climática',
        items: outfitToSave.items,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'OUTFIT_ERROR');
      }

      const newId = result.outfit?.id ?? result.id;

      setSavedOutfits((current) => ({
        ...current,
        [outfitToSave.key]: { id: newId, name },
      }));

      let message = { type: 'ok', text: 'Outfit guardado en Mis outfits.' };

      if (saveModal === 'today') {
        const status = await markAsUsedToday(newId, name);

        message =
          status === 'error'
            ? { type: 'error', text: 'Se guardó el outfit, pero no se pudo registrar como usado.' }
            : { type: 'ok', text: '¡Listo! Lo guardamos y lo registramos en tu historial de hoy.' };
      }

      setSaveMessage(message);
      setSaveModal(null);
    } catch (error) {
      console.log('Error guardando outfit recomendado:', error);
      setSaveMessage({ type: 'error', text: 'No se pudo guardar el outfit. Probá de nuevo.' });
      setSaveModal(null);
    } finally {
      setSavingOutfit(false);
    }
  }, [saveName, outfitToSave, userId, saveModal, markAsUsedToday]);


  // ----------------------------------------------------------
  // CARGAR PRENDAS
  // ----------------------------------------------------------

  const loadClothes =
    useCallback(async () => {
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

        const list =
          Array.isArray(result)
            ? result
            : Array.isArray(
                result?.data
              )
              ? result.data
              : [];

        setClothes(list);

        return list;
      } catch (error) {
        console.log(
          'Error al cargar prendas:',
          error
        );

        setClothes([]);

        return [];
      }
    }, [userId]);


  // ----------------------------------------------------------
  // ACTUALIZAR RECOMENDACIONES
  // ----------------------------------------------------------

  const updateRecommendations =
    useCallback(
      (
        weatherResult,
        clothingList
      ) => {
        if (
          !weatherResult ||
          !Array.isArray(
            clothingList
          )
        ) {
          setOutfitOptions([]);
          setMissingItems([]);
          return;
        }

        const result =
          buildOutfitOptions(
            clothingList,
            weatherResult
          );

        setOutfitOptions(
          result.outfits
        );

        setAlternatives(
          result.alternatives
        );

        setSelectedOutfit(0);
        setSwaps({});

        setMissingItems(
          result.missing
        );

        // El pronóstico por hora llega aparte: si falla,
        // simplemente no mostramos las capas.
        setDayHours([]);

        getRestOfDayForecast(
          weatherResult.latitude,
          weatherResult.longitude
        )
          .then(setDayHours)
          .catch((error) => {
            console.log(
              'No se pudo obtener el pronóstico por hora:',
              error
            );
          });
      },
      []
    );


  // ----------------------------------------------------------
  // CONSULTAR CLIMA
  // ----------------------------------------------------------

  const loadWeather =
    useCallback(
      async (cityToSearch) => {
        const cleanCity =
          String(
            cityToSearch || ''
          ).trim();

        if (!cleanCity) {
          setErrorMessage(
            'Debés ingresar el nombre de una ciudad.'
          );

          return false;
        }

        setLoadingWeather(true);
        setErrorMessage('');

        try {
          const result =
            await getWeatherByCity(
              cleanCity
            );

          if (!result) {
            throw new Error(
              'No se encontraron datos del clima para esa ciudad.'
            );
          }

          setWeather(result);

          const resolvedCity =
            result.city ||
            cleanCity;

          setCity(resolvedCity);
          setCityInput(resolvedCity);

          await saveUserCity(
            user,
            resolvedCity
          );

          const freshClothes =
            await loadClothes();

          updateRecommendations(
            result,
            freshClothes
          );

          return true;
        } catch (error) {
          console.log(
            'Error al obtener clima:',
            error
          );

          setWeather(null);
          setOutfitOptions([]);
          setMissingItems([]);

          setErrorMessage(
            error?.message ||
              'No se pudo obtener el clima en este momento.'
          );

          return false;
        } finally {
          setLoadingWeather(false);
          setLoading(false);
        }
      },
      [
        loadClothes,
        updateRecommendations,
        user,
      ]
    );


  // ----------------------------------------------------------
  // INICIALIZACIÓN
  // ----------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const initialize =
      async () => {
        setLoading(true);
        setErrorMessage('');

        try {
          if (
            userId === null ||
            userId === undefined
          ) {
            if (mounted) {
              setClothes([]);
              setWeather(null);
              setOutfitOptions([]);
              setMissingItems([]);
              setLoading(false);
            }

            return;
          }

          const [
            savedCity,
          ] = await Promise.all([
            getUserCity(user),
            loadClothes(),
          ]);

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
              savedCity
            );
          } else {
            setWeather(null);
            setOutfitOptions([]);
            setMissingItems([]);
            setCity('');
            setCityInput('');
            setLoading(false);
          }
        } catch (error) {
          console.log(
            'Error inicializando clima:',
            error
          );

          if (mounted) {
            setWeather(null);
            setOutfitOptions([]);
            setMissingItems([]);
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
    userId,
    loadClothes,
    loadWeather,
    user,
  ]);


  // ----------------------------------------------------------
  // ACTUALIZAR RECOMENDACIONES CUANDO CAMBIAN LAS PRENDAS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!weather) {
      return;
    }

    updateRecommendations(
      weather,
      clothes
    );
  }, [
    weather,
    clothes,
    updateRecommendations,
  ]);


  // ----------------------------------------------------------
  // CAMBIAR CIUDAD
  // ----------------------------------------------------------

  const openCityModal =
    useCallback(() => {
      setCityInput(
        city || ''
      );

      setErrorMessage('');

      setCityModalVisible(
        true
      );
    }, [city]);


  const closeCityModal =
    useCallback(() => {
      if (loadingWeather) {
        return;
      }

      Keyboard.dismiss();

      setCityModalVisible(
        false
      );
    }, [loadingWeather]);


  const handleConfirmCity =
    useCallback(async () => {
      const cleanCity =
        cityInput.trim();

      if (!cleanCity) {
        setErrorMessage(
          'Debés ingresar el nombre de una ciudad.'
        );

        return;
      }

      Keyboard.dismiss();

      const success =
        await loadWeather(
          cleanCity
        );

      if (success) {
        setCityModalVisible(
          false
        );
      }
    }, [
      cityInput,
      loadWeather,
    ]);


  // ----------------------------------------------------------
  // ACTUALIZAR
  // ----------------------------------------------------------

  const handleRefreshRecommendations =
    useCallback(async () => {
      if (
        refreshingRecommendations
      ) {
        return;
      }

      setRefreshingRecommendations(
        true
      );

      try {
        if (city) {
          await loadWeather(
            city
          );
        } else {
          const freshClothes =
            await loadClothes();

          updateRecommendations(
            weather,
            freshClothes
          );
        }
      } finally {
        setRefreshingRecommendations(
          false
        );
      }
    }, [
      city,
      loadClothes,
      loadWeather,
      refreshingRecommendations,
      updateRecommendations,
      weather,
    ]);


  // ----------------------------------------------------------
  // MENÚ LATERAL
  // ----------------------------------------------------------

  const handleOpenAddMenu =
    useCallback(() => {
      setAddMenuVisible(true);
    }, []);


  const handleCloseAddMenu =
    useCallback(() => {
      setAddMenuVisible(false);
    }, []);


  const handleCloseSideMenu =
    useCallback(() => {
      setSideMenuVisible(false);
    }, []);


  // ----------------------------------------------------------
  // NAVEGACIÓN
  // ----------------------------------------------------------

  const goToMainTab =
    useCallback(
      (tabName) => {
        navigation?.navigate?.(
          'Main',
          {
            user,
            initialTab: tabName,
            navTs: Date.now(),
          }
        );
      },
      [navigation, user]
    );


  const handleAddClothing =
    useCallback(() => {
      setAddMenuVisible(false);

      navigation?.navigate?.(
        'AddClothing',
        { user }
      );
    }, [
      navigation,
      user,
    ]);


  const handleCreateOutfit =
    useCallback(() => {
      setAddMenuVisible(false);

      navigation?.navigate?.(
        'CreateOutfit',
        { user }
      );
    }, [
      navigation,
      user,
    ]);


  const handleProfile =
    useCallback(() => {
      setSideMenuVisible(false);

      navigation?.navigate?.(
        'Profile',
        { user }
      );
    }, [
      navigation,
      user,
    ]);


  const handleAbout =
    useCallback(() => {
      setSideMenuVisible(false);

      navigation?.navigate?.(
        'AboutApp',
        { user }
      );
    }, [
      navigation,
      user,
    ]);


  const handleHelp =
    useCallback(() => {
      setSideMenuVisible(false);

      navigation?.navigate?.(
        'Help',
        { user }
      );
    }, [
      navigation,
      user,
    ]);


  const handleLogout =
    useCallback(() => {
      setSideMenuVisible(false);

      confirmLogout(
        navigation
      );
    }, [navigation]);


  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

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


  const hasClothes =
    clothes.length > 0;


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
              goToMainTab
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

                  <TouchableOpacity
                    onPress={() =>
                      setErrorMessage(
                        ''
                      )
                    }
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color="#B42318"
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              <View
                style={[
                  screenStyles.mainGrid,
                  isDesktop &&
                    screenStyles.mainGridDesktop,
                ]}
              >
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
                          Outfits recomendados para hoy
                        </Text>
                      </View>

                      {advice ? (
                        <View
                          style={[
                            screenStyles.infoBox,
                            screenStyles.adviceBox,
                          ]}
                        >
                          <Ionicons
                            name="partly-sunny-outline"
                            size={20}
                            color="#8C73D6"
                          />

                          <Text
                            style={
                              screenStyles.infoBoxText
                            }
                          >
                            {advice.text}
                          </Text>
                        </View>
                      ) : null}

                      {recommendations.length ===
                      0 ? (
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
                          <OutfitSelector
                            outfits={
                              outfitOptions
                            }
                            selected={
                              selectedOutfit
                            }
                            onSelect={
                              handleSelectOutfit
                            }
                          />

                          {recommendations.map(
                            (
                              entry,
                              index
                            ) => (
                              <View
                                key={`${entry.slot}-${index}`}
                              >
                                <ClothingRecommendationCard
                                  item={
                                    entry.item
                                  }
                                  label={
                                    entry.label
                                  }
                                  reason={
                                    entry.reason
                                  }
                                />

                                {entry.slot !==
                                  'accessory' && (
                                  <AlternativesRow
                                    slot={
                                      entry.slot
                                    }
                                    currentId={
                                      entry.id
                                    }
                                    options={
                                      alternatives[
                                        entry.slot
                                      ]
                                    }
                                    onPick={
                                      handleSwap
                                    }
                                  />
                                )}
                              </View>
                            )
                          )}
                        </View>
                      )}

                      {recommendations.length >
                        0 &&
                        missingItems.length >
                          0 && (
                          <View
                            style={[
                              screenStyles.infoBox,
                              screenStyles.missingBox,
                            ]}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color="#8C73D6"
                            />

                            <Text
                              style={
                                screenStyles.infoBoxText
                              }
                            >
                              Para completar el outfit te
                              vendría bien sumar{' '}
                              {missingItems.join(', ')}.
                            </Text>
                          </View>
                        )}

                      {recommendations.length > 0 && (
                        <View style={saveStyles.actionsBlock}>
                          <View style={saveStyles.actionsRow}>
                            <TouchableOpacity
                              style={[
                                saveStyles.secondaryAction,
                                (!outfitToSave.complete || savedId || savingOutfit) &&
                                  saveStyles.disabled,
                              ]}
                              onPress={() => openSaveModal('save')}
                              disabled={!outfitToSave.complete || Boolean(savedId) || savingOutfit}
                              activeOpacity={0.85}
                            >
                              <Ionicons
                                name={savedId ? 'checkmark-circle' : 'bookmark-outline'}
                                size={18}
                                color="#8C73D6"
                              />
                              <Text style={saveStyles.secondaryActionText}>
                                {savedId ? 'Guardado' : 'Guardar outfit'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                saveStyles.primaryAction,
                                (!outfitToSave.complete || savingOutfit) && saveStyles.disabled,
                              ]}
                              onPress={() =>
                                savedId ? handleUseSavedToday() : openSaveModal('today')
                              }
                              disabled={!outfitToSave.complete || savingOutfit}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                              <Text style={saveStyles.primaryActionText}>
                                Me lo pongo hoy
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {!outfitToSave.complete ? (
                            <Text style={saveStyles.hint}>
                              Para guardarlo, el outfit necesita una parte de arriba, una de abajo (o un vestido) y un calzado.
                            </Text>
                          ) : null}

                          {saveMessage ? (
                            <View
                              style={[
                                saveStyles.message,
                                saveMessage.type === 'error' && saveStyles.messageError,
                              ]}
                            >
                              <Ionicons
                                name={
                                  saveMessage.type === 'error'
                                    ? 'alert-circle-outline'
                                    : 'checkmark-circle-outline'
                                }
                                size={18}
                                color={saveMessage.type === 'error' ? '#B42318' : '#2E9D57'}
                              />
                              <Text style={saveStyles.messageText}>{saveMessage.text}</Text>
                            </View>
                          ) : null}
                        </View>
                      )}

                      {recommendations.length >
                        0 &&
                        layerSuggestions.length >
                          0 && (
                          <View
                            style={
                              optionStyles.layersSection
                            }
                          >
                            <Text
                              style={
                                optionStyles.layersTitle
                              }
                            >
                              Durante el día
                            </Text>

                            {layerSuggestions.map(
                              (suggestion) => (
                                <LayerSuggestionCard
                                  key={`${suggestion.label}-${suggestion.id}`}
                                  suggestion={
                                    suggestion
                                  }
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
                          Estas recomendaciones se
                          generan utilizando las prendas
                          que tenés registradas en tu armario
                          y las condiciones climáticas actuales.
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
            onPress={() =>
              goToMainTab('Inicio')
            }
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
            onPress={() =>
              goToMainTab('Prendas')
            }
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
            onPress={() =>
              goToMainTab('Outfits')
            }
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
            onPress={() =>
              goToMainTab('Maleta')
            }
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

      <SaveOutfitModal
        visible={saveModal !== null}
        mode={saveModal}
        name={saveName}
        setName={setSaveName}
        saving={savingOutfit}
        onConfirm={handleConfirmSave}
        onClose={() => {
          if (!savingOutfit) setSaveModal(null);
        }}
      />

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
        visible={
          sideMenuVisible
        }
        onClose={
          handleCloseSideMenu
        }
        onProfile={
          handleProfile
        }
        onAbout={
          handleAbout
        }
        onHelp={
          handleHelp
        }
        onLogout={
          handleLogout
        }
        user={user}
      />

      <AddMenuModal
        visible={
          addMenuVisible
        }
        onClose={
          handleCloseAddMenu
        }
        onAddPrenda={
          handleAddClothing
        }
        onAddOutfit={
          handleCreateOutfit
        }
      />
    </View>
  );
};


// ============================================================
// ESTILOS
// ============================================================

const screenStyles =
  StyleSheet.create({
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
      minWidth: 0,
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
      maxWidth: 1250,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
    },

    mainGrid: {
      flexDirection: 'column',
      gap: 18,
    },

    mainGridDesktop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },

    weatherColumn: {
      width: '40%',
      minWidth: 320,
      maxWidth: 500,
    },

    recommendationsColumn: {
      flex: 1,
      minWidth: 0,
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
      fontFamily: 'Poppins_400Regular',
      flex: 1,
      color: '#B42318',
      fontSize: 14,
      lineHeight: 20,
    },

    noWeatherCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#ECE8F3',
    },

    noWeatherTitle: {
      fontFamily: 'Poppins_600SemiBold',
      marginTop: 10,
      fontSize: 20,
      color: '#302B3B',
    },

    noWeatherDescription: {
      fontFamily: 'Poppins_400Regular',
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: '#77727F',
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
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      fontSize: 14,
    },

    recommendationsSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: '#ECE8F3',
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
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
      fontFamily: 'Poppins_600SemiBold',
      flex: 1,
      color: '#302B3B',
      fontSize: 17,
    },

    recommendationsList: {
      width: '100%',
    },

    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: '#F1ECFB',
      borderRadius: 14,
      paddingHorizontal: 15,
      paddingVertical: 14,
      marginTop: 6,
    },

    adviceBox: {
      marginTop: 0,
      marginBottom: 14,
    },

    missingBox: {
      marginTop: 2,
      marginBottom: 8,
    },

    infoBoxText: {
      fontFamily: 'Poppins_400Regular',
      flex: 1,
      color: '#5B5566',
      fontSize: 13,
      lineHeight: 19,
    },

    refreshButton: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#8C73D6',
      borderRadius: 14,
      paddingHorizontal: 15,
      marginTop: 16,
    },

    refreshButtonDisabled: {
      opacity: 0.7,
    },

    refreshButtonText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      fontSize: 14,
    },

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F7F5FB',
    },

    loadingText: {
      fontFamily: 'Poppins_400Regular',
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
      padding: 20,
      borderWidth: 1,
      borderColor: '#ECE8F3',
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    cityContainer: {
      flex: 1,
      minWidth: 0,
    },

    cityLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    cityName: {
      fontFamily: 'Poppins_600SemiBold',
      flexShrink: 1,
      color: '#302B3B',
      fontSize: 19,
    },

    changeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#8C73D6',
      borderRadius: 10,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },

    changeButtonText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      fontSize: 12,
    },

    weatherMain: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      minHeight: 90,
    },

    iconContainer: {
      width: 85,
      height: 85,
      alignItems: 'center',
      justifyContent: 'center',
    },

    weatherIcon: {
      width: 85,
      height: 85,
    },

    temperatureContainer: {
      flex: 1,
      minWidth: 0,
      marginLeft: 8,
    },

    temperature: {
      fontFamily: 'Poppins_700Bold',
      color: '#302B3B',
      fontSize: 42,
      lineHeight: 48,
    },

    condition: {
      fontFamily: 'Poppins_400Regular',
      color: '#77727F',
      fontSize: 15,
      marginTop: 2,
    },

    divider: {
      height: 1,
      backgroundColor: '#F0EDF4',
      marginTop: 20,
      marginBottom: 15,
    },

    bottomInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      rowGap: 12,
    },

    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    infoLabel: {
      fontFamily: 'Poppins_400Regular',
      color: '#77727F',
      fontSize: 12,
    },

    infoValue: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#302B3B',
      fontSize: 12,
    },
  });


const recommendationStyles =
  StyleSheet.create({
    card: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#F0EDF4',
      padding: 13,
      marginBottom: 11,
      gap: 13,
    },

    imageContainer: {
      width: 70,
      height: 70,
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
      minWidth: 0,
    },

    slotLabel: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#8C73D6',
      fontSize: 11,
      marginBottom: 2,
    },

    title: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#302B3B',
      fontSize: 15,
      lineHeight: 19,
    },

    category: {
      fontFamily: 'Poppins_400Regular',
      color: '#77727F',
      fontSize: 12,
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
      fontFamily: 'Poppins_400Regular',
      flexShrink: 1,
      color: '#4E4A55',
      fontSize: 12,
    },

    reason: {
      fontFamily: 'Poppins_400Regular',
      color: '#77727F',
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 5,
    },
  });


const saveStyles =
  StyleSheet.create({
    actionsBlock: {
      marginTop: 4,
      marginBottom: 14,
    },

    actionsRow: {
      flexDirection: 'row',
      gap: 10,
    },

    secondaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#DCD2F2',
      backgroundColor: '#FFFFFF',
    },

    secondaryActionText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#8C73D6',
      fontSize: 14,
    },

    primaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 46,
      borderRadius: 12,
      backgroundColor: '#8C73D6',
    },

    primaryActionText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      fontSize: 14,
    },

    disabled: {
      opacity: 0.5,
    },

    hint: {
      fontFamily: 'Poppins_400Regular',
      color: '#77727F',
      fontSize: 12,
      marginTop: 8,
    },

    message: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: '#EAF8EE',
    },

    messageError: {
      backgroundColor: '#FDECEC',
    },

    messageText: {
      flex: 1,
      fontFamily: 'Poppins_400Regular',
      color: '#302B3B',
      fontSize: 13,
    },

    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },

    modal: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 20,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },

    title: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#302B3B',
      fontSize: 18,
    },

    description: {
      fontFamily: 'Poppins_400Regular',
      color: '#77727F',
      fontSize: 13,
      marginBottom: 14,
    },

    label: {
      fontFamily: 'Poppins_500Medium',
      color: '#302B3B',
      fontSize: 13,
      marginBottom: 6,
    },

    input: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: '#302B3B',
      borderWidth: 1,
      borderColor: '#E4D9F5',
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 46,
      backgroundColor: '#FCFBFE',
    },

    buttons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },

    cancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E4D9F5',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelText: {
      fontFamily: 'Poppins_500Medium',
      color: '#77727F',
      fontSize: 14,
    },

    confirmButton: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      backgroundColor: '#764DC6',
      alignItems: 'center',
      justifyContent: 'center',
    },

    confirmText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      fontSize: 14,
    },
  });

const optionStyles =
  StyleSheet.create({
    selectorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },

    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#DCD2F2',
      backgroundColor: '#FFFFFF',
    },

    chipActive: {
      backgroundColor: '#8C73D6',
      borderColor: '#8C73D6',
    },

    chipText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#8C73D6',
      fontSize: 13,
    },

    chipTextActive: {
      color: '#FFFFFF',
    },

    altContainer: {
      marginTop: -4,
      marginBottom: 14,
      paddingLeft: 6,
    },

    altTitle: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#77727F',
      fontSize: 11,
      marginBottom: 6,
    },

    altList: {
      gap: 10,
      paddingRight: 6,
    },

    altItem: {
      width: 64,
      alignItems: 'center',
    },

    altImageBox: {
      width: 52,
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ECE8F3',
      backgroundColor: '#F7F5FB',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },

    altImage: {
      width: '100%',
      height: '100%',
    },

    altName: {
      fontFamily: 'Poppins_400Regular',
      marginTop: 4,
      fontSize: 10,
      color: '#4E4A55',
      textAlign: 'center',
      width: '100%',
    },

    layersSection: {
      marginTop: 6,
      marginBottom: 6,
    },

    layersTitle: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#302B3B',
      fontSize: 15,
      marginBottom: 10,
    },

    layerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      marginBottom: 10,
      borderRadius: 14,
      backgroundColor: '#F7F3FF',
      borderWidth: 1,
      borderColor: '#E6DDF8',
    },

    layerIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    layerContent: {
      flex: 1,
      minWidth: 0,
    },

    layerLabel: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#8C73D6',
      fontSize: 11,
    },

    layerTitle: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#302B3B',
      fontSize: 14,
      marginTop: 2,
    },

    layerReason: {
      fontFamily: 'Poppins_400Regular',
      color: '#4E4A55',
      fontSize: 12,
      marginTop: 2,
    },

    layerImage: {
      width: 48,
      height: 48,
      borderRadius: 10,
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
      fontFamily: 'Poppins_600SemiBold',
      textAlign: 'center',
      fontSize: 18,
      lineHeight: 24,
      color: '#302B3B',
    },

    description: {
      fontFamily: 'Poppins_400Regular',
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
      backgroundColor:
        'rgba(0,0,0,0.42)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    modal: {
      width: '100%',
      maxWidth: 500,
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
      flex: 1,
    },

    title: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 19,
      color: '#302B3B',
    },

    description: {
      fontFamily: 'Poppins_400Regular',
      marginTop: 12,
      color: '#77727F',
      fontSize: 14,
      lineHeight: 20,
    },

    input: {
      fontFamily: 'Poppins_400Regular',
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
      fontFamily: 'Poppins_600SemiBold',
      color: '#66616E',
      fontSize: 14,
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
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      fontSize: 14,
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
      height:
        MOBILE_BOTTOM_NAV_HEIGHT,
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
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 10,
      color: '#6F6F6F',
    },
  });


export default WeatherRecScreen;