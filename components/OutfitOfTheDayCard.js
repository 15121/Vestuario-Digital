// ============================================================
// TARJETA "TU OUTFIT DE HOY" (pantalla de inicio)
// ============================================================
//
// Ubicación: components/OutfitOfTheDayCard.js
//
// Usa el clima que ya consulta la pantalla de inicio y las
// prendas del armario para mostrar, apenas entrás, qué ponerte
// hoy. El botón lleva a la pantalla de recomendación por clima,
// donde están las otras opciones.
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react';

import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { buildOutfitRecommendation } from '../utils/outfitrecommender';

// En el navegador no existe el "driver nativo" de animaciones
// (daba un aviso en la terminal): se usa solo en el celular.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';



const PURPLE = '#8C73D6';

const getTitle = (item) =>
  item?.title || item?.name || item?.nombre || 'Prenda';

const getImage = (item) =>
  item?.imageUri || item?.image || item?.foto || item?.photo || null;


export default function OutfitOfTheDayCard({
  weather,
  clothes,
  onPress,
  isDesktop,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const recommendation = useMemo(
    () =>
      weather && Array.isArray(clothes) && clothes.length > 0
        ? buildOutfitRecommendation(clothes, weather)
        : null,
    [weather, clothes]
  );

  const items = recommendation?.items || [];

  useEffect(() => {
    if (items.length === 0) return;

    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [items.length, fadeAnim]);

  // Sin clima o sin prendas adecuadas, no mostramos la tarjeta
  // (la pantalla del armario ya invita a cargar prendas).
  if (items.length === 0) {
    return null;
  }

  const temp = Math.round(Number(weather.feelsLike ?? weather.temp));

  return (
    <Animated.View
      style={[
        styles.card,
        isDesktop && styles.cardDesktop,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Tu outfit de hoy</Text>
          <Text style={styles.subtitle}>
            Pensado para {Number.isFinite(temp) ? `${temp}°C` : 'el clima de hoy'}
            {weather.city ? ` en ${String(weather.city).split(',')[0]}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsRow}
      >
        {items.map((entry, index) => {
          const image = getImage(entry.item);

          return (
            <View key={`${entry.slot}-${entry.id}-${index}`} style={styles.item}>
              <View style={styles.imageBox}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="shirt-outline" size={26} color="#A8A8A8" />
                )}
              </View>

              <Text style={styles.itemSlot} numberOfLines={1}>
                {entry.label}
              </Text>

              <Text style={styles.itemName} numberOfLines={1}>
                {getTitle(entry.item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Ver más opciones</Text>
        <Ionicons name="arrow-forward" size={16} color={PURPLE} />
      </TouchableOpacity>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  // Mismo estilo que la tarjeta del clima del inicio.
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0EAF8',
    padding: 18,
    marginBottom: 24,
  },

  cardDesktop: {
    padding: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#302B3B',
    fontSize: 17,
  },

  subtitle: {
    fontFamily: 'Poppins_400Regular',
    color: '#77727F',
    fontSize: 12,
    marginTop: 1,
  },

  itemsRow: {
    gap: 12,
    paddingBottom: 2,
  },

  item: {
    width: 86,
  },

  imageBox: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: '#F7F5FB',
    borderWidth: 1,
    borderColor: '#ECE8F3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  itemSlot: {
    fontFamily: 'Poppins_600SemiBold',
    color: PURPLE,
    fontSize: 10,
    marginTop: 6,
  },

  itemName: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#302B3B',
    fontSize: 12,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3EEFC',
  },

  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: PURPLE,
    fontSize: 14,
  },
});
