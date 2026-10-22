// ============================================================
// PANTALLA: ESTADÍSTICAS DEL ARMARIO
// ============================================================
//
// Ubicación: screens/statsScreen.js
//
// Muestra, a partir de lo que la app ya guarda:
//   - números generales del armario
//   - prendas más usadas
//   - prendas que nunca usaste
//   - colores y categorías que más tenés
//
// Solo LEE la base de datos (prendas, outfits e historial).
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';

import {
  getUserClothes,
  getUserHistory,
  getUserOutfits,
} from '../services/database';

import { getColorHex } from '../utils/colorutils';
import { buildWardrobeStats } from '../utils/wardrobeStats';


const PURPLE = '#8C73D6';
const DARK = '#302B3B';
const GREY = '#77727F';
const BORDER = '#ECE8F3';

const asList = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];

const getTitle = (item) =>
  item?.title || item?.name || item?.nombre || 'Prenda';

const getImage = (item) =>
  item?.imageUri || item?.image || item?.foto || item?.photo || null;


// ============================================================
// PIEZAS
// ============================================================

const StatTile = ({ icon, value, label, isDesktop }) => (
  <View style={[styles.tile, isDesktop && styles.tileDesktop]}>
    <Ionicons name={icon} size={20} color={PURPLE} />
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const Section = ({ icon, title, subtitle, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={17} color={PURPLE} />
      </View>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    {children}
  </View>
);

const Thumb = ({ item, size = 52 }) => {
  const image = getImage(item);

  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.thumbImage} resizeMode="contain" />
      ) : (
        <Ionicons name="shirt-outline" size={size * 0.4} color="#A8A8A8" />
      )}
    </View>
  );
};

// Barra que crece al aparecer.
const GrowBar = ({ ratio, color }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0.03, Math.min(1, ratio)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          {
            backgroundColor: color || PURPLE,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
};


// ============================================================
// PANTALLA
// ============================================================

export default function StatsScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const user = route?.params?.user || null;
  const userId = user?.id ?? user?.id_usuario;

  const [data, setData] = useState({ clothes: [], outfits: [], history: [] });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (userId === null || userId === undefined) {
        setLoading(false);
        return undefined;
      }

      Promise.all([
        getUserClothes(userId).catch(() => []),
        getUserOutfits(userId).catch(() => []),
        getUserHistory(userId).catch(() => []),
      ]).then(([clothes, outfits, history]) => {
        if (!active) return;

        setData({
          clothes: asList(clothes),
          outfits: asList(outfits),
          history: asList(history),
        });
        setLoading(false);
      });

      return () => {
        active = false;
      };
    }, [userId])
  );

  const stats = useMemo(
    () => buildWardrobeStats(data.clothes, data.outfits, data.history),
    [data]
  );

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const maxUses = stats.mostUsed[0]?.uses || 1;

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mis estadísticas</Text>

        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.buttonDark} />
          <Text style={styles.loadingText}>Calculando tus estadísticas...</Text>
        </View>
      ) : stats.totals.clothes === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="hanger" size={52} color={PURPLE} />
          <Text style={styles.emptyTitle}>Todavía no tenés prendas</Text>
          <Text style={styles.emptyText}>
            Agregá prendas a tu armario para ver tus estadísticas.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          showsVerticalScrollIndicator={false}
        >
          {/* NÚMEROS GENERALES */}

          <View style={styles.tilesRow}>
            <StatTile icon="shirt-outline" value={stats.totals.clothes} label="Prendas" isDesktop={isDesktop} />
            <StatTile icon="layers-outline" value={stats.totals.outfits} label="Outfits" isDesktop={isDesktop} />
            <StatTile icon="calendar-outline" value={stats.totals.uses} label="Outfits usados" isDesktop={isDesktop} />
            <StatTile icon="pie-chart-outline" value={`${stats.totals.usedPercent}%`} label="Del armario usado" isDesktop={isDesktop} />
          </View>

          {stats.favoriteOutfit ? (
            <View style={styles.highlight}>
              <Ionicons name="trophy-outline" size={22} color="#FFFFFF" />
              <Text style={styles.highlightText}>
                Tu outfit favorito es <Text style={styles.highlightBold}>{stats.favoriteOutfit.name}</Text>
                {' '}({stats.favoriteOutfit.uses} {stats.favoriteOutfit.uses === 1 ? 'vez' : 'veces'})
              </Text>
            </View>
          ) : null}

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.column, isDesktop && styles.columnDesktop]}>
              {/* MÁS USADAS */}

              <Section
                icon="flame-outline"
                title="Tus prendas más usadas"
                subtitle="Según los outfits que registraste como usados"
              >
                {stats.mostUsed.length === 0 ? (
                  <Text style={styles.hint}>
                    Cuando marques outfits como usados, acá vas a ver tus prendas favoritas.
                  </Text>
                ) : (
                  stats.mostUsed.map((entry, index) => (
                    <View key={String(entry.item.id)} style={styles.rankRow}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                      <Thumb item={entry.item} size={46} />
                      <View style={styles.rankInfo}>
                        <View style={styles.rankTop}>
                          <Text style={styles.rankName} numberOfLines={1}>
                            {getTitle(entry.item)}
                          </Text>
                          <Text style={styles.rankUses}>
                            {entry.uses} {entry.uses === 1 ? 'uso' : 'usos'}
                          </Text>
                        </View>
                        <GrowBar ratio={entry.uses / maxUses} />
                      </View>
                    </View>
                  ))
                )}
              </Section>

              {/* COLORES */}

              <Section icon="color-palette-outline" title="Colores de tu armario">
                {stats.colors.map((entry) => (
                  <View key={entry.name} style={styles.barRow}>
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: getColorHex(entry.name, '#E5E1EC') },
                      ]}
                    />
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    <View style={styles.barBox}>
                      <GrowBar ratio={entry.percent / 100} color={PURPLE} />
                    </View>
                    <Text style={styles.barValue}>{entry.percent}%</Text>
                  </View>
                ))}
              </Section>
            </View>

            <View style={[styles.column, isDesktop && styles.columnDesktop]}>
              {/* NUNCA USADAS */}

              <Section
                icon="help-circle-outline"
                title="¿Te olvidaste de estas?"
                subtitle={
                  stats.neverUsed.length > 0
                    ? 'Prendas que todavía no usaste en ningún outfit'
                    : null
                }
              >
                {stats.neverUsed.length === 0 ? (
                  <Text style={styles.hint}>
                    ¡Usaste todas tus prendas al menos una vez!
                  </Text>
                ) : (
                  <View style={styles.forgottenGrid}>
                    {stats.neverUsed.map(({ item }) => (
                      <View key={String(item.id)} style={styles.forgottenItem}>
                        <Thumb item={item} size={72} />
                        <Text style={styles.forgottenName} numberOfLines={1}>
                          {getTitle(item)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Section>

              {/* CATEGORÍAS */}

              <Section icon="pricetags-outline" title="Por categoría">
                {stats.categories.map((entry) => (
                  <View key={entry.name} style={styles.barRow}>
                    <Text style={[styles.barLabel, styles.barLabelWide]} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    <View style={styles.barBox}>
                      <GrowBar ratio={entry.percent / 100} color="#B87EEE" />
                    </View>
                    <Text style={styles.barValue}>{entry.count}</Text>
                  </View>
                ))}
              </Section>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },

  loadingText: {
    color: GREY,
    fontSize: 14,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: GREY,
    fontSize: 14,
    textAlign: 'center',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  contentDesktop: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: 28,
  },

  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },

  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },

  tileDesktop: {
    flexBasis: '22%',
    padding: 18,
  },

  tileValue: {
    color: DARK,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },

  tileLabel: {
    color: GREY,
    fontSize: 12,
  },

  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  highlightText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },

  highlightBold: {
    fontWeight: '800',
  },

  columns: {
    gap: 0,
  },

  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },

  column: {
    width: '100%',
  },

  columnDesktop: {
    flex: 1,
    width: 'auto',
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: GREY,
    fontSize: 12,
  },

  hint: {
    color: GREY,
    fontSize: 13,
    lineHeight: 18,
  },

  thumb: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F7F5FB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  thumbImage: {
    width: '100%',
    height: '100%',
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  rankNumber: {
    width: 18,
    color: PURPLE,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  rankInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },

  rankTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  rankName: {
    flex: 1,
    color: DARK,
    fontSize: 14,
    fontWeight: '700',
  },

  rankUses: {
    color: GREY,
    fontSize: 12,
    fontWeight: '700',
  },

  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEE9F7',
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    borderRadius: 5,
  },

  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DDD6E8',
  },

  barLabel: {
    width: 80,
    color: DARK,
    fontSize: 13,
    fontWeight: '600',
  },

  barLabelWide: {
    width: 104,
  },

  barBox: {
    flex: 1,
  },

  barValue: {
    width: 38,
    textAlign: 'right',
    color: GREY,
    fontSize: 12,
    fontWeight: '700',
  },

  forgottenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  forgottenItem: {
    width: 76,
  },

  forgottenName: {
    color: DARK,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
