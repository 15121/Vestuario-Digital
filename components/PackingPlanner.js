// ============================================================
// PLANIFICADOR DEL MODO MALETA
// ============================================================
//
// Ubicación: components/PackingPlanner.js
//
// Tres piezas que usa screens/packingModeScreen.js:
//
//   useTripForecast  → trae el clima del destino para las fechas.
//   TripWeatherCard  → muestra ese clima, día por día.
//   PackingPlanCard  → cantidades recomendadas por tipo de prenda,
//                      botón "Sugerir prendas" y barra de progreso.
//
// No guarda nada nuevo en la base de datos: las cantidades y las
// sugerencias se calculan en el momento, y la barra usa el tilde
// "la llevo" que la maleta ya guardaba.
// ============================================================

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { getTripForecast } from '../services/forecastService';

import {
  PACKING_SLOTS,
  buildPackingSuggestion,
  getClothingSlot,
  getPackingQuantities,
  getSlotLabel,
} from '../utils/outfitrecommender';


const PURPLE = '#8C73D6';
const DARK = '#302B3B';
const GREY = '#77727F';
const BORDER = '#ECE8F3';
const SOFT = '#F7F3FF';
const GREEN = '#2E9D57';

const WEEK_DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const SLOT_ICONS = {
  top: 'shirt-outline',
  bottom: 'git-merge-outline',
  outer: 'snow-outline',
  footwear: 'footsteps-outline',
  accessory: 'glasses-outline',
};

const SLOT_PLURALS = {
  top: 'Partes de arriba',
  bottom: 'Partes de abajo',
  outer: 'Abrigos',
  footwear: 'Calzado',
  accessory: 'Accesorios',
};


// ============================================================
// FECHAS
// ============================================================

const pad2 = (n) => String(n).padStart(2, '0');

const toDateString = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime())
    ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
    : null;

// Cantidad de días del viaje (inicio y fin incluidos).
export const getTripDays = (startDate, endDate) => {
  const start = toDateString(startDate);
  const end = toDateString(endDate);

  if (!start || !end || end < start) {
    return 0;
  }

  const a = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const b = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return Math.round((b - a) / 86400000) + 1;
};

const formatShortDay = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: WEEK_DAYS_SHORT[date.getDay()],
    day: `${d}/${m}`,
  };
};


// ============================================================
// HOOK: CLIMA DEL VIAJE
// ============================================================

export const useTripForecast = (destination, startDate, endDate) => {
  const [state, setState] = useState({
    loading: false,
    error: '',
    data: null,
  });

  const start = toDateString(startDate);
  const end = toDateString(endDate);
  const place = String(destination || '').trim();

  useEffect(() => {
    if (place.length < 3 || !start || !end || end < start) {
      setState({ loading: false, error: '', data: null });
      return undefined;
    }

    let cancelled = false;

    setState((current) => ({ ...current, loading: true, error: '' }));

    // Esperamos a que el usuario termine de escribir el destino.
    const timer = setTimeout(() => {
      getTripForecast(place, start, end)
        .then((data) => {
          if (!cancelled) setState({ loading: false, error: '', data });
        })
        .catch((error) => {
          if (!cancelled) {
            setState({
              loading: false,
              error: error?.message || 'No se pudo obtener el clima del destino.',
              data: null,
            });
          }
        });
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [place, start, end]);

  return state;
};


// ============================================================
// TARJETA: CLIMA DEL DESTINO
// ============================================================

export const TripWeatherCard = ({
  destination,
  hasDates,
  forecast,
  isDesktop,
}) => {
  const { loading, error, data } = forecast;

  if (!String(destination || '').trim() || !hasDates) {
    return (
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="partly-sunny-outline" size={18} color={PURPLE} />
          </View>
          <Text style={styles.cardTitle}>Clima del destino</Text>
        </View>

        <Text style={styles.hint}>
          Completá el destino y las fechas para ver el clima de tu viaje.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="partly-sunny-outline" size={18} color={PURPLE} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>
            Clima en {data?.place?.name || destination}
          </Text>

          {data?.place?.country ? (
            <Text style={styles.cardSubtitle}>
              {[data.place.region, data.place.country].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={PURPLE} />
          <Text style={styles.hint}>Buscando el pronóstico…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : data ? (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Ionicons name="thermometer-outline" size={15} color={PURPLE} />
              <Text style={styles.summaryText}>
                {data.summary.min}° a {data.summary.max}°
              </Text>
            </View>

            <View style={styles.summaryPill}>
              <Ionicons name="rainy-outline" size={15} color={PURPLE} />
              <Text style={styles.summaryText}>
                {data.summary.rainyDays === 0
                  ? 'Sin lluvia'
                  : `${data.summary.rainyDays} ${
                      data.summary.rainyDays === 1 ? 'día' : 'días'
                    } con lluvia`}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysList}
          >
            {data.days.map((day) => {
              const label = formatShortDay(day.date);

              return (
                <View key={day.date} style={styles.dayItem}>
                  <Text style={styles.dayWeekday}>{label.weekday}</Text>
                  <Text style={styles.dayDate}>{label.day}</Text>
                  <Ionicons
                    name={day.icon}
                    size={24}
                    color={PURPLE}
                    style={styles.dayIcon}
                  />
                  <Text style={styles.dayMax}>{Math.round(day.max)}°</Text>
                  <Text style={styles.dayMin}>{Math.round(day.min)}°</Text>
                </View>
              );
            })}
          </ScrollView>

          {data.summary.estimated ? (
            <Text style={styles.note}>
              * Para las fechas a más de 16 días mostramos el clima que hubo
              en esos mismos días el año pasado, como referencia.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
};


// ============================================================
// TARJETA: QUÉ LLEVAR + BARRA DE PROGRESO
// ============================================================

// Cuántas prendas tildadas hay de cada tipo.
const countPackedBySlot = (clothes, packedItems) => {
  const counts = { other: 0 };
  PACKING_SLOTS.forEach((slot) => {
    counts[slot] = 0;
  });

  (clothes || []).forEach((item) => {
    if (!packedItems?.[item.id]?.packed) return;

    let slot = getClothingSlot(item);

    // Un vestido o enterito cuenta como parte de arriba.
    if (slot === 'onepiece') slot = 'top';

    counts[slot && counts[slot] !== undefined ? slot : 'other'] += 1;
  });

  return counts;
};

export const PackingPlanCard = ({
  clothes,
  packedItems,
  tripDays,
  forecast,
  onAutoPack,
  isDesktop,
}) => {
  const [message, setMessage] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const summary = forecast?.data?.summary || null;

  const quantities = useMemo(
    () => (tripDays > 0 ? getPackingQuantities(tripDays, summary) : null),
    [tripDays, summary]
  );

  const packedBySlot = useMemo(
    () => countPackedBySlot(clothes, packedItems),
    [clothes, packedItems]
  );

  const totalPacked = Object.values(packedBySlot).reduce((a, b) => a + b, 0);

  const totals = useMemo(() => {
    if (!quantities) return { done: 0, total: 0 };

    return PACKING_SLOTS.reduce(
      (acc, slot) => ({
        done: acc.done + Math.min(packedBySlot[slot], quantities[slot]),
        total: acc.total + quantities[slot],
      }),
      { done: 0, total: 0 }
    );
  }, [quantities, packedBySlot]);

  const ratio = totals.total > 0 ? totals.done / totals.total : 0;
  const complete = totals.total > 0 && totals.done >= totals.total;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ratio,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [ratio, progressAnim]);

  // Si cambian las fechas o el destino, el mensaje anterior ya no vale.
  useEffect(() => {
    setMessage(null);
  }, [tripDays, summary]);

  const handleSuggest = () => {
    const suggestion = buildPackingSuggestion(clothes, tripDays, summary);
    const toPack = [];

    PACKING_SLOTS.forEach((slot) => {
      let need = suggestion.quantities[slot] - packedBySlot[slot];

      suggestion.picks[slot].forEach((pick) => {
        if (need > 0 && !packedItems?.[pick.id]?.packed) {
          toPack.push(pick.id);
          need -= 1;
        }
      });
    });

    if (toPack.length > 0) {
      onAutoPack(toPack);
    }

    setMessage({
      added: toPack.length,
      missing: suggestion.missing,
    });
  };

  if (!quantities) {
    return (
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="list-outline" size={18} color={PURPLE} />
          </View>
          <Text style={styles.cardTitle}>Qué llevar</Text>
        </View>

        <Text style={styles.hint}>
          Elegí las fechas del viaje y te decimos cuántas prendas llevar de cada tipo.
        </Text>

        <Text style={styles.totalText}>
          Prendas en la maleta: <Text style={styles.totalNumber}>{totalPacked}</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="list-outline" size={18} color={PURPLE} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>Qué llevar</Text>
          <Text style={styles.cardSubtitle}>
            Para {tripDays} {tripDays === 1 ? 'día' : 'días'}
            {summary ? ' según el clima del destino' : ''}
          </Text>
        </View>
      </View>

      {/* BARRA DE PROGRESO */}

      <View style={styles.progressBlock}>
        <View style={styles.progressTextRow}>
          <Text style={[styles.progressText, complete && styles.progressTextDone]}>
            {complete
              ? '¡Maleta lista!'
              : `${totals.done} de ${totals.total} prendas recomendadas`}
          </Text>

          <Text style={[styles.progressPercent, complete && styles.progressTextDone]}>
            {Math.round(ratio * 100)}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              complete && styles.progressFillDone,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <Text style={styles.totalText}>
          Prendas en la maleta: <Text style={styles.totalNumber}>{totalPacked}</Text>
        </Text>
      </View>

      {/* CANTIDADES POR TIPO */}

      <View style={[styles.slotGrid, isDesktop && styles.slotGridDesktop]}>
        {PACKING_SLOTS.map((slot) => {
          const wanted = quantities[slot];
          const have = packedBySlot[slot];
          const ok = have >= wanted;

          return (
            <View
              key={slot}
              style={[
                styles.slotItem,
                isDesktop && styles.slotItemDesktop,
                ok && wanted > 0 && styles.slotItemDone,
              ]}
            >
              <Ionicons
                name={ok && wanted > 0 ? 'checkmark-circle' : SLOT_ICONS[slot]}
                size={18}
                color={ok && wanted > 0 ? GREEN : PURPLE}
              />

              <View style={styles.slotTextBox}>
                <Text style={styles.slotLabel} numberOfLines={1}>
                  {SLOT_PLURALS[slot] || getSlotLabel(slot)}
                </Text>

                <Text style={styles.slotCount}>
                  {wanted === 0 ? 'No hace falta' : `${Math.min(have, wanted)} de ${wanted}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSuggest}
        style={styles.suggestButton}
      >
        <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
        <Text style={styles.suggestButtonText}>Sugerir prendas de mi armario</Text>
      </TouchableOpacity>

      {message ? (
        <View style={styles.messageBox}>
          <Ionicons name="information-circle-outline" size={18} color={PURPLE} />
          <Text style={styles.messageText}>
            {message.added > 0
              ? `Agregamos ${message.added} ${
                  message.added === 1 ? 'prenda' : 'prendas'
                } a la maleta. Revisalas abajo y sacá las que no quieras.`
              : 'Ya tenés todo lo recomendado que hay en tu armario.'}
            {message.missing.length > 0
              ? ` En tu armario no alcanzan para completar: ${message.missing.join(', ')}.`
              : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
};


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 16,
  },

  cardDesktop: {
    padding: 20,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
    fontSize: 16,
  },

  cardSubtitle: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 12,
    marginTop: 1,
  },

  hint: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 13,
    lineHeight: 18,
  },

  errorText: {
    fontFamily: 'Poppins_400Regular',
    color: '#D64545',
    fontSize: 13,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SOFT,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  summaryText: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
    fontSize: 13,
  },

  daysList: {
    gap: 8,
    paddingBottom: 2,
  },

  dayItem: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FCFBFE',
  },

  dayWeekday: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
    fontSize: 12,
  },

  dayDate: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 11,
  },

  dayIcon: {
    marginVertical: 6,
  },

  dayMax: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
    fontSize: 14,
  },

  dayMin: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 12,
  },

  note: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },

  progressBlock: {
    marginBottom: 14,
  },

  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  progressText: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
    fontSize: 14,
  },

  progressPercent: {
    fontFamily: 'Poppins_700Bold',
    color: PURPLE,
    fontSize: 13,
  },

  progressTextDone: {
    color: GREEN,
  },

  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EEE9F7',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: PURPLE,
  },

  progressFillDone: {
    backgroundColor: GREEN,
  },

  totalText: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 12,
    marginTop: 8,
  },

  totalNumber: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
  },

  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  slotGridDesktop: {
    gap: 10,
  },

  slotItem: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FCFBFE',
  },

  slotItemDesktop: {
    flexBasis: '18%',
  },

  slotItemDone: {
    borderColor: '#B9E4C4',
    backgroundColor: '#F1FAF3',
  },

  slotTextBox: {
    flex: 1,
    minWidth: 0,
  },

  slotLabel: {
    fontFamily: 'Poppins_700Bold',
    color: DARK,
    fontSize: 12,
  },

  slotCount: {
    fontFamily: 'Poppins_400Regular',
    color: GREY,
    fontSize: 12,
  },

  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  suggestButtonText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
  },

  messageBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: SOFT,
  },

  messageText: {
    fontFamily: 'Poppins_400Regular',
    flex: 1,
    color: DARK,
    fontSize: 13,
    lineHeight: 18,
  },
});
