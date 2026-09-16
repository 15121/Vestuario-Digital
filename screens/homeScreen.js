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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colours';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { getArmarioSummary } from '../services/database';

import ilustracionImg from '../assets/ilustracion.png';

export default function HomeScreen({ navigation, route, user: userFromProps }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const user = userFromProps || route?.params?.user;
  const isTempPassword = route?.params?.isTempPassword || false;

  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [weatherData] = useState({
    temp: '--',
    description: '--',
    location: '--',
  });

  useEffect(() => {
    if (isTempPassword) {
      setShowToast(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setShowToast(false));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isTempPassword]);

  const [summary, setSummary] = useState({
    clothesCount: 0,
    outfitsCount: 0,
    usedThisWeekCount: 0,
    activeSuitcasesCount: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const data = getArmarioSummary(user.id);
        setSummary(data);
      }
    }, [user])
  );

  return (
    <ResponsiveContainer>
      <View style={styles.mainWrapper}>

        {showToast && (
          <Animated.View style={[styles.floatingToast, { opacity: fadeAnim }]}>
            <Ionicons name="warning-outline" size={22} color="#D97706" />
            <Text style={styles.toastText}>
              Ingresaste con una clave temporal. Recordá cambiarla desde tu Perfil.
            </Text>
          </Animated.View>
        )}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>
              ¡Hola, {user?.name || 'Mateo'}! 👋
            </Text>
            <Text style={styles.greetingSubtitle}>¿Qué vamos a hacer hoy?</Text>
          </View>

          <View style={isDesktop ? styles.desktopMainGrid : styles.mobileMainGrid}>
            
            <View style={isDesktop ? styles.desktopLeftColumn : styles.fullWidth}>
              
              <View style={styles.quickAccessRow}>
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => navigation?.navigate('Prendas')}
                >
                  <View style={styles.quickIconCircle}>
                    <Ionicons name="shirt-outline" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.quickCardFooter}>
                    <View>
                      <Text style={styles.quickCardTitle}>Prendas</Text>
                      <Text style={styles.quickCardSubtitle}>Gestioná tu ropa</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>

                {/* ÍCONO DE OUTBITS CORREGIDO EN ACCESO RÁPIDO */}
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => navigation?.navigate('Outfits')}
                >
                  <View style={styles.quickIconCircle}>
                    <MaterialCommunityIcons name="hanger" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.quickCardFooter}>
                    <View>
                      <Text style={styles.quickCardTitle}>Outfits</Text>
                      <Text style={styles.quickCardSubtitle}>Creá y explorá looks</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.weatherCard}>
                <View style={styles.weatherHeader}>
                  <View style={styles.weatherIconCircle}>
                    <Ionicons name="partly-sunny-outline" size={26} color={COLORS.primary} />
                  </View>
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherLabel}>Recomendación climática</Text>
                    <View style={styles.tempRow}>
                      <Text style={styles.tempText}>
                        {weatherData.temp !== '--' ? `${weatherData.temp}°C` : '--'}
                      </Text>
                      <Text style={styles.weatherDesc}>{weatherData.description}</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
                      <Text style={styles.locationText}>{weatherData.location}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.weatherFooter}>
                  <TouchableOpacity style={styles.weatherButton}>
                    <Ionicons name="shirt-outline" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.weatherButtonText}>Ver sugerencias</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.changeCityButton}>
                    <Text style={styles.changeCityText}>Cambiar ciudad</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            <View style={isDesktop ? styles.desktopRightColumn : styles.fullWidth}>
              <Text style={styles.sectionTitle}>Resumen de tu armario</Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Ionicons name="shirt-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.summaryCount}>{summary.clothesCount}</Text>
                  <Text style={styles.summaryLabel}>Prendas</Text>
                </View>

                {/* ÍCONO DE OUTFITS CORREGIDO EN RESUMEN DE ARMARIO */}
                <View style={styles.summaryCard}>
                  <MaterialCommunityIcons name="hanger" size={22} color={COLORS.primary} />
                  <Text style={styles.summaryCount}>{summary.outfitsCount}</Text>
                  <Text style={styles.summaryLabel}>Outfits</Text>
                </View>

                <View style={styles.summaryCard}>
                  <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.summaryCount}>{summary.usedThisWeekCount}</Text>
                  <Text style={styles.summaryLabel}>Usados esta semana</Text>
                </View>

                <View style={styles.summaryCard}>
                  <Ionicons name="briefcase-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.summaryCount}>{summary.activeSuitcasesCount}</Text>
                  <Text style={styles.summaryLabel}>Maletas activas</Text>
                </View>
              </View>

              <View style={styles.promoCard}>
                <View style={styles.promoIllustrationContainer}>
                  <Image 
                    source={ilustracionImg} 
                    style={styles.promoImage} 
                    resizeMode="contain" 
                  />
                </View>
                <View style={styles.promoTextContainer}>
                  <Text style={styles.promoTitle}>Tu armario, siempre organizado</Text>
                  <Text style={styles.promoSubtitle}>
                    Agregá prendas, creá outfits y descubrí nuevas combinaciones.
                  </Text>
                </View>
              </View>

            </View>

          </View>
        </ScrollView>

      </View>
    </ResponsiveContainer>
  );
}

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
});