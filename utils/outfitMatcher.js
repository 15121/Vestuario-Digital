// ============================================================
// COMBINACIÓN DE PRENDAS POR COLOR Y TIPO
// ============================================================
//
// Ubicación: utils/outfitMatcher.js
//
// Lo usan:
//   - El botón "Sorprendeme" al crear un outfit.
//   - "Combina con…" en el detalle de una prenda.
//
// Reglas de color (simples, como las usaría una persona):
//   1. Los neutros (negro, blanco, gris, beige, jean, etc.)
//      combinan con todo.
//   2. Dos prendas del mismo color o de tonos vecinos combinan
//      (por ejemplo celeste + azul).
//   3. Colores opuestos en la rueda de colores también pueden
//      combinar (por ejemplo azul + naranja), pero un poco menos.
//   4. Dos colores fuertes sin relación son la peor opción.
//
// No usa la base de datos: trabaja con las prendas ya cargadas.
// ============================================================

import {
  getColorHex,
  isMulticolor,
  normalizeColorName,
} from './colorutils';

import {
  isAccessory,
  isLower,
  isOnePiece,
  isShoes,
  isUpper,
} from './clothingCategories';


// Colores que combinan con todo.
const NEUTRAL_NAMES = [
  'negro', 'blanco', 'hueso', 'gris oscuro', 'gris', 'gris claro',
  'gris topo', 'beige', 'crema', 'camel', 'caqui', 'nude',
  'azul jean', 'azul marino', 'marron', 'chocolate',
  'dorado', 'plateado',
];


// ============================================================
// COLOR → TONO (rueda de colores)
// ============================================================

const hexToHsl = (hex) => {
  const clean = String(hex || '').replace('#', '');

  if (clean.length < 6) {
    return null;
  }

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) {
    return { h: 0, s: 0, l };
  }

  const s = d / (1 - Math.abs(2 * l - 1));

  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return { h: (h * 60 + 360) % 360, s, l };
};

const describeColor = (item) => {
  const name = normalizeColorName(item?.color);

  if (!name || isMulticolor(item?.color)) {
    return { name, neutral: false, multi: Boolean(name), hsl: null };
  }

  const hsl = hexToHsl(getColorHex(item.color, ''));

  const neutral =
    NEUTRAL_NAMES.includes(name) ||
    (hsl ? hsl.s < 0.18 : false);

  return { name, neutral, multi: false, hsl };
};

const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};


/**
 * Qué tan bien combinan dos prendas por color (0 a 100).
 * También devuelve un texto corto que explica por qué.
 */
export const colorMatch = (a, b) => {
  const ca = describeColor(a);
  const cb = describeColor(b);

  // Sin color cargado: neutral para no castigarla.
  if (!ca.name || !cb.name) {
    return { score: 60, reason: 'Fácil de combinar' };
  }

  if (ca.neutral && cb.neutral) {
    return { score: 85, reason: 'Dos colores neutros' };
  }

  if (ca.neutral || cb.neutral) {
    return { score: 90, reason: 'Un neutro combina con todo' };
  }

  // Un estampado/multicolor queda mejor con algo liso y neutro.
  if (ca.multi || cb.multi) {
    return { score: 45, reason: 'Estampado con color' };
  }

  if (ca.name === cb.name) {
    return { score: 75, reason: 'Mismo color' };
  }

  if (!ca.hsl || !cb.hsl) {
    return { score: 55, reason: 'Combinación distinta' };
  }

  const distance = hueDistance(ca.hsl.h, cb.hsl.h);

  if (distance <= 40) {
    return { score: 80, reason: 'Tonos de la misma familia' };
  }

  if (distance >= 150) {
    return { score: 65, reason: 'Colores que contrastan' };
  }

  return { score: 30, reason: 'Colores fuertes distintos' };
};


// ============================================================
// TIPO DE PRENDA (usa las mismas categorías que crear outfit)
// ============================================================

export const getOutfitPart = (item) => {
  const category = item?.category || item?.categoria || '';

  if (isOnePiece(category)) return 'onepiece';
  if (isShoes(category)) return 'shoes';
  if (isLower(category)) return 'lower';
  if (isAccessory(category)) return 'accessory';
  if (isUpper(category)) return 'upper';

  return null;
};

const PART_LABELS = {
  upper: 'Parte de arriba',
  lower: 'Parte de abajo',
  onepiece: 'Prenda de una pieza',
  shoes: 'Calzado',
  accessory: 'Accesorio',
};

export const getPartLabel = (part) => PART_LABELS[part] || 'Prenda';


// ============================================================
// 1) SORPRENDEME
// ============================================================
//
// Arma un outfit al azar entre las MEJORES combinaciones, así
// cada vez que tocás el botón sale algo distinto pero lindo.
//
// Recibe las listas que ya arma la pantalla de crear outfit.
// Devuelve { upper, lower, shoes, reason } o null si no alcanza.

const pickWeighted = (options) => {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * total;

  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }

  return options[options.length - 1];
};

export const buildSurpriseOutfit = ({
  uppers = [],
  lowers = [],
  shoes = [],
  previousKey = '',
}) => {
  if (shoes.length === 0) {
    return null;
  }

  const combos = [];

  // Superior + inferior + calzado.
  uppers
    .filter((item) => !isOnePiece(item.category))
    .forEach((upper) => {
      lowers.forEach((lower) => {
        const top = colorMatch(upper, lower);

        shoes.forEach((shoe) => {
          const withShoes =
            (colorMatch(upper, shoe).score + colorMatch(lower, shoe).score) / 2;

          combos.push({
            upper,
            lower,
            shoes: shoe,
            score: top.score * 0.65 + withShoes * 0.35,
            reason: top.reason,
          });
        });
      });
    });

  // Prenda de una pieza + calzado.
  uppers
    .filter((item) => isOnePiece(item.category))
    .forEach((onepiece) => {
      shoes.forEach((shoe) => {
        const match = colorMatch(onepiece, shoe);

        combos.push({
          upper: onepiece,
          lower: null,
          shoes: shoe,
          score: match.score,
          reason: match.reason,
        });
      });
    });

  if (combos.length === 0) {
    return null;
  }

  const keyOf = (c) => `${c.upper?.id}-${c.lower?.id}-${c.shoes?.id}`;

  // Nos quedamos con las mejores (sin repetir la anterior si se puede).
  const sorted = combos.sort((a, b) => b.score - a.score);
  const best = sorted[0].score;

  let pool = sorted.filter((c) => c.score >= best - 20).slice(0, 25);
  const withoutPrevious = pool.filter((c) => keyOf(c) !== previousKey);

  if (withoutPrevious.length > 0) {
    pool = withoutPrevious;
  }

  const choice = pickWeighted(
    pool.map((c) => ({ ...c, weight: Math.max(1, c.score - (best - 25)) }))
  );

  return {
    upper: choice.upper,
    lower: choice.lower,
    shoes: choice.shoes,
    reason: choice.reason,
    key: keyOf(choice),
  };
};


// ============================================================
// 2) COMBINA CON…
// ============================================================
//
// Para una prenda, busca en el armario las que mejor combinan,
// agrupadas por el tipo de prenda que le falta al outfit.
//
// Devuelve [{ part, label, items: [{ item, score, reason }] }]

const COMPLEMENTS = {
  upper: ['lower', 'shoes', 'accessory'],
  lower: ['upper', 'shoes', 'accessory'],
  onepiece: ['shoes', 'accessory'],
  shoes: ['upper', 'lower', 'onepiece'],
  accessory: ['upper', 'lower', 'onepiece'],
};

export const findMatchingClothes = (item, clothes, { perGroup = 4 } = {}) => {
  const part = getOutfitPart(item);

  if (!part || !Array.isArray(clothes)) {
    return [];
  }

  const others = clothes.filter(
    (other) => String(other?.id) !== String(item?.id)
  );

  return COMPLEMENTS[part]
    .map((targetPart) => {
      const items = others
        .filter((other) => getOutfitPart(other) === targetPart)
        .map((other) => ({ item: other, ...colorMatch(item, other) }))
        .filter((entry) => entry.score >= 45)
        .sort((a, b) => b.score - a.score)
        .slice(0, perGroup);

      return {
        part: targetPart,
        label: getPartLabel(targetPart),
        items,
      };
    })
    .filter((group) => group.items.length > 0);
};
