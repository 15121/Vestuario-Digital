import React, { useState, useCallback, useEffect, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Image,
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../theme/colours';

import ResponsiveContainer from '../components/ResponsiveContainer';

import { getArmarioSummary } from '../services/database';

import { getWeatherByCity } from '../services/weatherService';

import {
  getUserCity,
  saveUserCity,
} from '../services/weatherStorage';

import ilustracionImg from '../assets/ilustracion.png';

// ============================================================
// ÍCONO DEL CLIMA SEGÚN LA CONDICIÓN ACTUAL
// ============================================================

const getHomeWeatherIcon = (conditionGroup, isWindy) => {
  if (isWindy && conditionGroup !== 'Thunderstorm') {
    return { family: 'material', name: 'weather-windy' };
  }

  switch (conditionGroup) {
    case 'Clear':
      return { family: 'ionicons', name: 'sunny-outline' };
    case 'Clouds':
      return { family: 'ionicons', name: 'cloudy-outline' };
    case 'Rain':
    case 'Drizzle':
      return { family: 'ionicons', name: 'rainy-outline' };
    case 'Thunderstorm':
      return { family: 'ionicons', name: 'thunderstorm-outline' };
    case 'Snow':
      return { family: 'ionicons', name: 'snow-outline' };
    case 'Mist':
    case 'Fog':
    case 'Haze':
    case 'Smoke':
    case 'Dust':
    case 'Sand':
      return { family: 'ionicons', name: 'cloud-outline' };
    default:
      return { family: 'ionicons', name: 'partly-sunny-outline' };
  }
};


export default function HomeScreen({
  navigation,
  route,
  user: userProp,
  onNavigateToClothing,
  onNavigateToOutfits,
  onNavigateToSuitcases,
}) {
  const {
    width,
  } = useWindowDimensions();

  const isDesktop =
    width > 768;

  const user =
    userProp ||
    route?.params?.user ||
    null;

  const isTempPassword =
    route?.params?.isTempPassword ||
    false;

  const [showToast, setShowToast] = useState(false);

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;


  // ==========================================================
  // CLIMA
  // ==========================================================

    const [weatherData, setWeatherData] = useState({
    temp: '--',
    description: '--',
    location: '--',
    city: '',
    conditionDescription: '',
    conditionGroup: '',
    isWindy: false,
  });

  const [cityInput, setCityInput] = useState('');

  const [cityModalVisible, setCityModalVisible] =
    useState(false);

  const [loadingWeather, setLoadingWeather] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState('');

  const userId =
    user?.id ||
    user?.id_usuario;


  // ==========================================================
  // CONSULTAR CLIMA
  // ==========================================================

  const loadWeather = useCallback(
    async (city) => {
      const cleanCity = String(
        city || ''
      ).trim();

      if (!cleanCity) {
        setWeatherError(
          'Ingresá una ciudad para consultar el clima.'
        );

        return false;
      }

      try {
        setLoadingWeather(true);

        setWeatherError('');

        const result =
          await getWeatherByCity(cleanCity);

               setWeatherData({
          temp: result?.temp ?? '--',

          description:
            result?.conditionDescription ||
            result?.description ||
            '--',

          location:
            result?.city ||
            cleanCity,

          city:
            result?.city ||
            cleanCity,

          conditionDescription:
            result?.conditionDescription ||
            '',

          conditionGroup:
            result?.conditionGroup ||
            '',

          isWindy:
            result?.isWindy ||
            false,
        });

        setCityInput(
          result?.city ||
          cleanCity
        );

        await saveUserCity(
          user,
          cleanCity
        );

        return true;
      } catch (error) {
        console.error(
          'Error al consultar el clima:',
          error
        );

        setWeatherError(
          error?.message ||
          'No se pudo consultar el clima.'
        );

        return false;
      } finally {
        setLoadingWeather(false);
      }
    },
    [user]
  );


  // ==========================================================
  // CARGAR CIUDAD GUARDADA
  // ==========================================================

  useEffect(() => {
    let active = true;

    const loadSavedCity = async () => {
      try {
        const savedCity =
          await getUserCity(user);

        if (
          active &&
          savedCity
        ) {
          setCityInput(savedCity);

          await loadWeather(savedCity);
        }
      } catch (error) {
        console.error(
          'Error al cargar la ciudad guardada:',
          error
        );
      }
    };

    loadSavedCity();

    return () => {
      active = false;
    };
  }, [
    userId,
    loadWeather,
  ]);


  // ==========================================================
  // NAVEGACIÓN A LA PANTALLA DEL CLIMA
  // ==========================================================

  const openWeatherScreen = () => {
    navigation?.navigate(
      'WeatherRecScreen',
      {
        user,
      }
    );
  };


  // ==========================================================
  // ACCIONES DEL CLIMA
  // ==========================================================

 const handleWeatherPress = () => {
  openWeatherScreen();
};

  const handleSearchCity = async () => {
    Keyboard.dismiss();

    const success =
      await loadWeather(cityInput);

    if (success) {
      setCityModalVisible(false);
    }
  };


  const handleChangeCity = () => {
    setCityInput(
      weatherData.city ||
      ''
    );

    setWeatherError('');

    setCityModalVisible(true);
  };


  // ==========================================================
  // TOAST DE CLAVE TEMPORAL
  // ==========================================================

  useEffect(() => {
    if (isTempPassword) {
      setShowToast(true);

      Animated.timing(
        fadeAnim,
        {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }
      ).start();

      const timer = setTimeout(() => {
        Animated.timing(
          fadeAnim,
          {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }
        ).start(() => {
          setShowToast(false);
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [
    isTempPassword,
  ]);


  // ==========================================================
  // RESUMEN DEL ARMARIO
  // ==========================================================

  const [summary, setSummary] = useState({
    clothesCount: 0,
    outfitsCount: 0,
    usedThisWeekCount: 0,
    activeSuitcasesCount: 0,
  });


  useFocusEffect(
    useCallback(() => {
      if (
        user?.id ||
        user?.id_usuario
      ) {
        const currentUserId =
          user?.id ||
          user?.id_usuario;

        const data =
          getArmarioSummary(currentUserId);

        setSummary(data);
      }
    }, [user])
  );


  // ==========================================================
  // RENDERIZADO
  // ==========================================================

  return (
    <ResponsiveContainer>
      <View style={styles.mainWrapper}>

        {showToast && (
          <Animated.View
            style={[
              styles.floatingToast,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={22}
              color="#D97706"
            />

            <Text style={styles.toastText}>
              Ingresaste con una clave temporal.
              Recordá cambiarla desde tu Perfil.
            </Text>
          </Animated.View>
        )}


        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop &&
              styles.desktopScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>
              ¡Hola, {user?.name || 'Mateo'}! 👋
            </Text>

            <Text style={styles.greetingSubtitle}>
              ¿Qué vamos a hacer hoy?
            </Text>
          </View>


          <View
            style={
              isDesktop
                ? styles.desktopMainGrid
                : styles.mobileMainGrid
            }
          >

            <View
              style={
                isDesktop
                  ? styles.desktopLeftColumn
                  : styles.fullWidth
              }
            >

              {/* ACCESOS RÁPIDOS */}

              <View style={styles.quickAccessRow}>

<TouchableOpacity
  style={styles.quickCard}
  onPress={() => {
    if (onNavigateToClothing) {
      onNavigateToClothing();
      return;
    }

    navigation?.navigate(
      'Prendas'
    );
  }}
>

                  <View style={styles.quickIconCircle}>
                    <Ionicons
                      name="shirt-outline"
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.quickCardFooter}>
                    <View>
                      <Text style={styles.quickCardTitle}>
                        Prendas
                      </Text>

                      <Text style={styles.quickCardSubtitle}>
                        Gestioná tu ropa
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>


<TouchableOpacity
  style={styles.quickCard}
  onPress={() => {
    if (onNavigateToOutfits) {
      onNavigateToOutfits();
      return;
    }

    navigation?.navigate(
      'Outfits'
    );
  }}
>
                  <View style={styles.quickIconCircle}>
                    <MaterialCommunityIcons
                      name="hanger"
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.quickCardFooter}>
                    <View>
                      <Text style={styles.quickCardTitle}>
                        Outfits
                      </Text>

                      <Text style={styles.quickCardSubtitle}>
                        Creá y explorá looks
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>

              </View>


              {/* TARJETA DEL CLIMA */}

              <TouchableOpacity
                style={styles.weatherCard}
                onPress={handleWeatherPress}
                activeOpacity={0.9}
              >

                <View style={styles.weatherHeader}>

                                    <View style={styles.weatherIconCircle}>
                    {(() => {
                      const homeWeatherIcon =
                        getHomeWeatherIcon(
                          weatherData.conditionGroup,
                          weatherData.isWindy
                        );

                      const HomeWeatherIconComponent =
                        homeWeatherIcon.family === 'material'
                          ? MaterialCommunityIcons
                          : Ionicons;

                      return (
                        <HomeWeatherIconComponent
                          name={homeWeatherIcon.name}
                          size={26}
                          color={COLORS.primary}
                        />
                      );
                    })()}
                  </View>


                  <View style={styles.weatherInfo}>

                    <Text style={styles.weatherLabel}>
                      Recomendación climática
                    </Text>


                    <View style={styles.tempRow}>

                      <Text style={styles.tempText}>
                        {weatherData.temp !== '--'
                          ? `${weatherData.temp}°C`
                          : '--'}
                      </Text>

                      <Text style={styles.weatherDesc}>
                        {weatherData.description}
                      </Text>

                    </View>


                    <View style={styles.locationRow}>

                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={COLORS.textLight}
                      />

                      <Text style={styles.locationText}>
                        {weatherData.location}
                      </Text>

                    </View>

                  </View>

                </View>


                <View style={styles.weatherFooter}>

                  <TouchableOpacity
                    style={styles.weatherButton}
                    onPress={handleWeatherPress}
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={15}
                      color={COLORS.primary}
                      style={{
                        marginRight: 6,
                      }}
                    />

                    <Text style={styles.weatherButtonText}>
                      Ver sugerencias
                    </Text>
                  </TouchableOpacity>


                  <TouchableOpacity
                    style={styles.changeCityButton}
                    onPress={handleChangeCity}
                  >
                    <Text style={styles.changeCityText}>
                      Cambiar ciudad
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>

                </View>

              </TouchableOpacity>

            </View>


            {/* RESUMEN DEL ARMARIO */}

            <View
              style={
                isDesktop
                  ? styles.desktopRightColumn
                  : styles.fullWidth
              }
            >

              <Text style={styles.sectionTitle}>
                Resumen de tu armario
              </Text>


              <View style={styles.summaryGrid}>

            <TouchableOpacity
  style={styles.summaryCard}
  onPress={() => {
    if (onNavigateToClothing) {
      onNavigateToClothing();
      return;
    }

    navigation?.navigate('Prendas');
  }}
  activeOpacity={0.82}
>
  <Ionicons 
    name="shirt-outline" 
    size={22} 
    color={COLORS.primary} 
  />

  <Text style={styles.summaryCount}> 
    {summary.clothesCount} 
  </Text>

  <Text style={styles.summaryLabel}> 
    Prendas 
  </Text>
</TouchableOpacity>


              <TouchableOpacity
  style={styles.summaryCard}
  onPress={() => {
    if (onNavigateToOutfits) {
      onNavigateToOutfits();
      return;
    }

    navigation?.navigate('Outfits');
  }}
  activeOpacity={0.82}
>
  <MaterialCommunityIcons 
    name="hanger" 
    size={22} 
    color={COLORS.primary} 
  />

  <Text style={styles.summaryCount}> 
    {summary.outfitsCount} 
  </Text>

  <Text style={styles.summaryLabel}> 
    Outfits 
  </Text>
</TouchableOpacity>


                <View style={styles.summaryCard}>
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={COLORS.primary}
                  />

                  <Text style={styles.summaryCount}>
                    {summary.usedThisWeekCount}
                  </Text>

                  <Text style={styles.summaryLabel}>
                    Usados esta semana
                  </Text>
                </View>


              <TouchableOpacity
  style={styles.summaryCard}
  onPress={() => {
    if (onNavigateToSuitcases) {
      onNavigateToSuitcases();
    }
  }}
  activeOpacity={0.82}
>
  <View style={styles.summaryCardIconRow}>
    <Ionicons
      name="briefcase-outline"
      size={22}
      color={COLORS.primary}
    />

    <Ionicons
      name="chevron-forward"
      size={14}
      color={COLORS.primary}
      style={styles.summaryCardChevron}
    />
  </View>

  <Text style={styles.summaryCount}>
    {summary.activeSuitcasesCount}
  </Text>

  <Text style={styles.summaryLabel}>
    Maletas
  </Text>
</TouchableOpacity>

              </View>


              {/* TARJETA PROMOCIONAL */}

              <View style={styles.promoCard}>

                <View style={styles.promoIllustrationContainer}>
                  <Image
                    source={ilustracionImg}
                    style={styles.promoImage}
                    resizeMode="contain"
                  />
                </View>


                <View style={styles.promoTextContainer}>

                  <Text style={styles.promoTitle}>
                    Tu armario, siempre organizado
                  </Text>

                  <Text style={styles.promoSubtitle}>
                    Agregá prendas, creá outfits y
                    descubrí nuevas combinaciones.
                  </Text>

                </View>

              </View>

            </View>

          </View>

        </ScrollView>


        {/* MENSAJE DE ERROR DEL CLIMA */}

        {weatherError ? (
          <View style={styles.weatherErrorBox}>

            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#B42318"
            />

            <Text style={styles.weatherErrorText}>
              {weatherError}
            </Text>

          </View>
        ) : null}


        {/* MODAL PARA INGRESAR LA CIUDAD */}

        <Modal
          visible={cityModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setCityModalVisible(false)
          }
        >

          <Pressable
            style={styles.weatherModalOverlay}
            onPress={() =>
              setCityModalVisible(false)
            }
          >

            <Pressable
              style={styles.weatherModal}
              onPress={(event) =>
                event.stopPropagation()
              }
            >

              <View style={styles.weatherModalHeader}>

                <Text style={styles.weatherModalTitle}>
                  Ingresá tu ciudad
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setCityModalVisible(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textDark}
                  />
                </TouchableOpacity>

              </View>


              <Text style={styles.weatherModalDescription}>
                Indicá dónde estás para consultar el clima
                y recibir recomendaciones de tu armario.
              </Text>


              <TextInput
                value={cityInput}
                onChangeText={setCityInput}
                placeholder="Ej. Córdoba"
                placeholderTextColor="#9A8CA1"
                style={styles.weatherCityInput}
                returnKeyType="search"
                onSubmitEditing={handleSearchCity}
              />


              <TouchableOpacity
                style={styles.weatherModalButton}
                onPress={handleSearchCity}
                disabled={loadingWeather}
              >

                {loadingWeather ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="search-outline"
                      size={19}
                      color="#FFFFFF"
                    />

                    <Text style={styles.weatherModalButtonText}>
                      Consultar clima
                    </Text>
                  </>
                )}

              </TouchableOpacity>

            </Pressable>

          </Pressable>

        </Modal>

      </View>
    </ResponsiveContainer>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  mainWrapper: {
    flex: 1,
    backgroundColor: '#FAF8FC',
    width: '100%',
  },


  floatingToast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },


  toastText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#92400E',
  },


  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },


  desktopScrollContent: {
    paddingLeft: 110,
    paddingRight: 40,
    paddingTop: 30,
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
  },


  greetingContainer: {
    marginBottom: 20,
  },


  greetingTitle: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.primary,
  },


  greetingSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    marginTop: 2,
  },


  fullWidth: {
    width: '100%',
  },


  mobileMainGrid: {
    flexDirection: 'column',
  },


  desktopMainGrid: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'flex-start',
    width: '100%',
  },


  desktopLeftColumn: {
    flex: 1,
  },


  desktopRightColumn: {
    flex: 1,
  },


  quickAccessRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 16,
  },


  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#F0EAF8',
  },


  quickIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },


  quickCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },


  quickCardTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },


  quickCardSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },


  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0EAF8',
  },


  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  weatherIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },


  weatherInfo: {
    flex: 1,
  },


  weatherLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
  },


  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },


  tempText: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
  },


  weatherDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },


  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },


  locationText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
  },


  weatherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },


  weatherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },


  weatherButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
  },


  changeCityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  changeCityText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
    marginRight: 2,
  },


  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },


  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    width: '100%',
  },


  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0EAF8',
  },


  summaryCount: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginTop: 4,
  },


  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 2,
  },


  promoCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },


  promoIllustrationContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },


  promoImage: {
    width: '100%',
    height: '100%',
  },


  promoTextContainer: {
    flex: 1,
  },


  promoTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },


  promoSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textDark,
    lineHeight: 16,
  },


  weatherErrorBox: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    zIndex: 20,
    backgroundColor: '#FEE4E2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },


  weatherErrorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },


  weatherModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 22, 45, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },


  weatherModal: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },


  weatherModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },


  weatherModalTitle: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 21,
    fontFamily: 'Poppins_600SemiBold',
  },


  weatherModalDescription: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },


  weatherCityInput: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D9CBE4',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: COLORS.textDark,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },


  weatherModalButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: COLORS.buttonDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
  },


  weatherModalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  summaryCardIconRow: {
  width: '100%',

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},

summaryCardChevron: {
  position: 'absolute',

  right: 0,
},

});