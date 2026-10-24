// ============================================================
// HISTORIAL EN CALENDARIO
// ============================================================
//
// Ubicación: components/HistoryCalendar.js
//
// Muestra un mes con los días en que usaste algún outfit
// marcados. Al tocar un día, aparecen abajo los outfits de ese
// día (usando la misma tarjeta del historial en lista).
//
// Solo usa el historial que ya se carga en la pantalla:
// no consulta ni guarda nada en la base de datos.
// ============================================================

import React, { useMemo, useState } from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colours';


const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// La semana empieza el lunes, como en el calendario de la maleta.
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const pad2 = (n) => String(n).padStart(2, '0');

const dayKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseEntryDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};


export default function HistoryCalendar({
  history,
  renderEntry,
  isDesktop,
}) {
  // Agrupar el historial por día (fecha local).
  const byDay = useMemo(() => {
    const map = new Map();

    (Array.isArray(history) ? history : []).forEach((entry) => {
      const date = parseEntryDate(entry?.date);
      if (!date) return;

      const key = dayKey(date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });

    return map;
  }, [history]);

  // Se abre en el mes del último uso (o el actual).
  const initialMonth = useMemo(() => {
    const last = (Array.isArray(history) ? history : [])
      .map((entry) => parseEntryDate(entry?.date))
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    const base = last || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [history]);

  const [month, setMonth] = useState(initialMonth);
  const [selectedKey, setSelectedKey] = useState(null);

  const todayKey = dayKey(new Date());

  // Celdas del mes (con huecos al principio para alinear el lunes).
  const cells = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstWeekDay = (new Date(year, m, 1).getDay() + 6) % 7;

    const list = [];

    for (let i = 0; i < firstWeekDay; i += 1) {
      list.push(null);
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push(new Date(year, m, d));
    }

    while (list.length % 7 !== 0) {
      list.push(null);
    }

    return list;
  }, [month]);

  const monthUses = cells.reduce(
    (sum, date) => sum + (date ? (byDay.get(dayKey(date)) || []).length : 0),
    0
  );

  const changeMonth = (delta) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedKey(null);
  };

  const selectedEntries = selectedKey ? byDay.get(selectedKey) || [] : [];

  const selectedLabel = selectedKey
    ? (() => {
        const [y, m, d] = selectedKey.split('-').map(Number);
        return `${d} de ${MONTH_NAMES[m - 1].toLowerCase()} de ${y}`;
      })()
    : '';

  return (
    <View>
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>
        {/* ENCABEZADO DEL MES */}

        <View style={styles.monthRow}>
          <Pressable
            onPress={() => changeMonth(-1)}
            style={styles.arrow}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.buttonDark} />
          </Pressable>

          <View style={styles.monthTitleBox}>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
            </Text>

            <Text style={styles.monthSubtitle}>
              {monthUses === 0
                ? 'Sin outfits usados este mes'
                : `${monthUses} ${monthUses === 1 ? 'outfit usado' : 'outfits usados'} este mes`}
            </Text>
          </View>

          <Pressable
            onPress={() => changeMonth(1)}
            style={styles.arrow}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={22} color={COLORS.buttonDark} />
          </Pressable>
        </View>

        {/* DÍAS DE LA SEMANA */}

        <View style={styles.weekRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        {/* GRILLA */}

        <View style={styles.grid}>
          {cells.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.cell} />;
            }

            const key = dayKey(date);
            const count = (byDay.get(key) || []).length;
            const used = count > 0;
            const selected = key === selectedKey;
            const isToday = key === todayKey;

            return (
              <Pressable
                key={key}
                style={styles.cell}
                onPress={() => setSelectedKey(used && !selected ? key : null)}
                disabled={!used}
              >
                <View
                  style={[
                    styles.dayCircle,
                    used && styles.dayCircleUsed,
                    selected && styles.dayCircleSelected,
                    isToday && !used && styles.dayCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      used && styles.dayTextUsed,
                      selected && styles.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>

                {count > 1 ? (
                  <Text style={styles.countText}>×{count}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendDot, styles.dayCircleUsed]} />
          <Text style={styles.legendText}>
            Día con outfit usado (tocalo para ver cuál)
          </Text>
        </View>
      </View>

      {/* OUTFITS DEL DÍA ELEGIDO */}

      {selectedKey ? (
        <View style={styles.selectedBlock}>
          <Text style={styles.selectedTitle}>{selectedLabel}</Text>

          {selectedEntries.map((entry, index) => (
            <View key={String(entry.id ?? index)}>{renderEntry(entry)}</View>
          ))}
        </View>
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0EAF8',
    padding: 16,
    marginBottom: 20,
  },

  cardDesktop: {
    padding: 22,
    maxWidth: 620,
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  arrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthTitleBox: {
    flex: 1,
    alignItems: 'center',
  },

  monthTitle: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    fontSize: 17,
  },

  monthSubtitle: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    fontSize: 12,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textLight,
    fontSize: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  cell: {
    width: `${100 / 7}%`,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayCircleUsed: {
    backgroundColor: '#EDE4FB',
  },

  dayCircleSelected: {
    backgroundColor: COLORS.buttonDark,
  },

  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },

  dayText: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textDark,
    fontSize: 14,
  },

  dayTextUsed: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.buttonDark,
  },

  dayTextSelected: {
    color: '#FFFFFF',
  },

  countText: {
    position: 'absolute',
    bottom: 0,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.buttonDark,
    fontSize: 9,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },

  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  legendText: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    fontSize: 12,
  },

  selectedBlock: {
    width: '100%',
    maxWidth: 620,
    marginBottom: 12,
  },

  selectedTitle: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    fontSize: 16,
    marginBottom: 12,
  },
});
