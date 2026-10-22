// ============================================================
// MOTOR DE RECOMENDACIÓN DE OUTFITS SEGÚN EL CLIMA
// ============================================================
//
// Ubicación: utils/outfitrecommender.js
//
// Uso:
//   const { items, missing, profile } =
//     buildOutfitRecommendation(clothes, weather);
//
// Cada elemento de `items` tiene la forma:
//   { item, id, slot, label, reason }
//
// Cómo funciona:
//   1. Clasifica cada prenda en un "slot" (arriba, abajo, abrigo,
//      calzado, accesorio, prenda completa) y le asigna un nivel
//      de abrigo de 0 (muy fresca) a 4 (muy abrigada).
//   2. Calcula el perfil del clima usando la SENSACIÓN TÉRMICA.
//   3. Para cada slot elige la prenda cuyo nivel de abrigo más se
//      acerca al ideal para ese clima, con bonus por lluvia,
//      viento, nieve y humedad.
//   4. Si falta algo importante (ej. abrigo con 5°C), lo informa
//      en `missing`.
// ============================================================


// ============================================================
// CONSTANTES
// ============================================================

const WINDY_THRESHOLD_MS = 8;

// Puntaje mínimo para que una prenda sea considerada adecuada.
const MIN_SCORE = 30;

// Nivel de abrigo ideal por slot según la franja de temperatura.
const TARGETS = {
  muy_frio: { top: 3, bottom: 2, outer: 4, footwear: 3, onepiece: 2.5 },
  frio: { top: 3, bottom: 2, outer: 3, footwear: 2.5, onepiece: 2.5 },
  fresco: { top: 2.5, bottom: 2, outer: 2.5, footwear: 2, onepiece: 2 },
  templado: { top: 1.5, bottom: 2, outer: 2, footwear: 2, onepiece: 1.5 },
  calido: { top: 1, bottom: 1, outer: 1, footwear: 1.5, onepiece: 1 },
  caluroso: { top: 0.5, bottom: 0.5, outer: 1, footwear: 1, onepiece: 0.5 },
};

const SLOT_LABELS = {
  top: 'Parte de arriba',
  bottom: 'Parte de abajo',
  onepiece: 'Prenda completa',
  outer: 'Abrigo',
  footwear: 'Calzado',
  accessory: 'Accesorio',
};


// ============================================================
// PALABRAS CLAVE
// ============================================================
//
// [palabra, slot, nivel de abrigo base, extra]
//
// Las palabras van sin tildes (el texto se normaliza antes).
// Se admite plural simple (s / es) y se respetan los límites de
// palabra, así "top" no matchea con "laptop".

const KEYWORDS = [
  // Prendas de una pieza
  ['vestido', 'onepiece', 1],
  ['enterito', 'onepiece', 1.5],
  ['mono', 'onepiece', 1.5],
  ['jumpsuit', 'onepiece', 1.5],
  ['conjunto', 'onepiece', 2],

  // Calzado
  ['sandalia', 'footwear', 0, { open: true }],
  ['ojota', 'footwear', 0, { open: true }],
  ['alpargata', 'footwear', 1, { open: true }],
  ['zapatilla', 'footwear', 2],
  ['zapato', 'footwear', 2],
  ['mocasin', 'footwear', 2],
  ['botin', 'footwear', 3],
  ['bota', 'footwear', 3],
  ['borcego', 'footwear', 3],
  ['calzado', 'footwear', 2],

  // Parte de abajo
  ['short', 'bottom', 0, { short: true }],
  ['bermuda', 'bottom', 0, { short: true }],
  ['pollera', 'bottom', 1],
  ['falda', 'bottom', 1],
  ['calza', 'bottom', 2],
  ['legging', 'bottom', 2],
  ['jogger', 'bottom', 2],
  ['jean', 'bottom', 2],
  ['pantalon', 'bottom', 2],

  // Abrigos / capas exteriores
  ['abrigo', 'outer', 4],
  ['parka', 'outer', 4],
  ['tapado', 'outer', 4],
  ['campera', 'outer', 3],
  ['chaqueta', 'outer', 3],
  ['poncho', 'outer', 3],
  ['saco', 'outer', 2],
  ['blazer', 'outer', 2],
  ['chaleco', 'outer', 2],
  ['piloto', 'outer', 2],
  ['impermeable', 'outer', 2],
  ['cortaviento', 'outer', 1.5],
  ['rompeviento', 'outer', 1.5],

  // Parte de arriba
  ['musculosa', 'top', 0, { sleeveless: true }],
  ['top', 'top', 0, { sleeveless: true }],
  ['remera', 'top', 1],
  ['camiseta', 'top', 1],
  ['chomba', 'top', 1],
  ['polo', 'top', 1],
  ['blusa', 'top', 1],
  ['body', 'top', 1],
  ['camisa', 'top', 1.5],
  ['polera', 'top', 2],
  ['cardigan', 'top', 2],
  ['buzo', 'top', 3],
  ['sweater', 'top', 3],
  ['sueter', 'top', 3],
  ['pullover', 'top', 3],
  ['pulover', 'top', 3],
  ['hoodie', 'top', 3],

  // Accesorios relevantes para el clima
  ['bufanda', 'accessory', 0, { kind: 'cold' }],
  ['gorro', 'accessory', 0, { kind: 'cold' }],
  ['guante', 'accessory', 0, { kind: 'cold' }],
  ['pasamontana', 'accessory', 0, { kind: 'cold' }],
  ['gorra', 'accessory', 0, { kind: 'sun' }],
  ['sombrero', 'accessory', 0, { kind: 'sun' }],
  ['anteojo', 'accessory', 0, { kind: 'sun' }],
  ['lente', 'accessory', 0, { kind: 'sun' }],
  ['paraguas', 'accessory', 0, { kind: 'rain' }],
].map(([word, slot, warmth, extra = {}]) => ({
  word,
  slot,
  warmth,
  ...extra,
  regex: new RegExp(`(?:^|[^a-z])(${word})(?:s|es)?(?![a-z])`),
}));

// Modificadores del nivel de abrigo (se buscan en todo el texto).
const WARMTH_UP = [
  'grueso', 'gruesa', 'lana', 'polar', 'termico', 'termica',
  'abrigado', 'abrigada', 'forrado', 'forrada', 'pluma', 'plumas',
  'felpa', 'invierno', 'pana', 'corderoy',
];

const WARMTH_DOWN = [
  'liviano', 'liviana', 'fino', 'fina', 'lino', 'ligero', 'ligera',
  'verano',
];

const RAIN_WORDS = [
  'impermeable', 'piloto', 'lluvia', 'waterproof', 'gore-tex', 'goretex',
];

const WIND_WORDS = ['cortaviento', 'rompeviento', 'viento'];

const NATURAL_FABRIC_WORDS = ['algodon', 'lino'];


// ============================================================
// UTILIDADES DE TEXTO
// ============================================================

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
};

const hasWord = (text, word) => {
  return new RegExp(`(?:^|[^a-z])${word}(?:s|es)?(?![a-z])`).test(text);
};

const hasAnyWord = (text, words) => {
  return words.some((word) => hasWord(text, word));
};

// Busca la palabra clave que aparece PRIMERO en el texto.
// En español el sustantivo principal suele ir al principio:
// "Campera de jean" → campera, "Pantalón de abrigo" → pantalón.
const findKeyword = (text) => {
  if (!text) {
    return null;
  }

  let best = null;

  for (const entry of KEYWORDS) {
    const match = entry.regex.exec(text);

    if (!match) {
      continue;
    }

    const position = match.index + match[0].indexOf(match[1]);

    if (!best || position < best.position) {
      best = { entry, position };
    }
  }

  return best ? best.entry : null;
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};


// ============================================================
// CLASIFICACIÓN DE PRENDAS
// ============================================================

const classifyClothing = (item) => {
  const title = normalizeText(item?.title || item?.name || item?.nombre);
  const description = normalizeText(item?.description || item?.descripcion);
  const category = normalizeText(item?.category || item?.categoria);
  const season = normalizeText(item?.season || item?.temporada);

  const allText = [title, description, category, season].join(' ');

  // Prioridad: título → descripción → categoría.
  const entry =
    findKeyword(title) ||
    findKeyword(description) ||
    findKeyword(category);

  if (!entry) {
    return null;
  }

  let warmth = entry.warmth;

  if (hasAnyWord(allText, WARMTH_UP)) {
    warmth += 1;
  }

  if (hasAnyWord(allText, WARMTH_DOWN)) {
    warmth -= 1;
  }

  if (entry.slot === 'top' || entry.slot === 'onepiece') {
    if (hasWord(allText, 'manga larga')) {
      warmth += 0.5;
    }

    if (hasWord(allText, 'manga corta')) {
      warmth -= 0.5;
    }
  }

  return {
    slot: entry.slot,
    word: entry.word,
    warmth: clamp(warmth, 0, 4),
    kind: entry.kind || null,
    open: Boolean(entry.open),
    short: Boolean(entry.short),
    sleeveless: Boolean(entry.sleeveless),
    rainProtected: hasAnyWord(allText, RAIN_WORDS),
    windproof: hasAnyWord(allText, WIND_WORDS),
    natural: hasAnyWord(allText, NATURAL_FABRIC_WORDS),
  };
};

const getItemId = (item, index) => {
  return String(
    item?.id ??
      item?.id_prenda ??
      item?.idClothing ??
      `clothing-${index}`
  );
};


// ============================================================
// PERFIL DEL CLIMA
// ============================================================

const getBand = (effectiveTemp) => {
  if (effectiveTemp <= 5) return 'muy_frio';
  if (effectiveTemp <= 11) return 'frio';
  if (effectiveTemp <= 16) return 'fresco';
  if (effectiveTemp <= 21) return 'templado';
  if (effectiveTemp <= 26) return 'calido';
  return 'caluroso';
};

export const buildWeatherProfile = (weather) => {
  if (!weather) {
    return null;
  }

  const temp = Number(weather.temp);
  const feelsLike = Number(weather.feelsLike);

  const effective = Number.isFinite(feelsLike) ? feelsLike : temp;

  if (!Number.isFinite(effective)) {
    return null;
  }

  const group = weather.conditionGroup;

  const rain =
    group === 'Rain' || group === 'Drizzle' || group === 'Thunderstorm';

  const snow = group === 'Snow';

  const windy =
    weather.isWindy === true ||
    Number(weather.windSpeedMs || 0) >= WINDY_THRESHOLD_MS;

  const humid = Number(weather.humidity || 0) >= 75;

  const clear = group === 'Clear';

  const band = getBand(effective);

  // ¿Conviene sumar una capa exterior?
  const needsOuter =
    snow ||
    rain ||
    band === 'muy_frio' ||
    band === 'frio' ||
    band === 'fresco' ||
    (band === 'templado' && (windy || effective <= 18));

  return {
    effective,
    band,
    rain,
    snow,
    windy,
    humid,
    clear,
    needsOuter,
  };
};


// ============================================================
// PUNTAJE
// ============================================================

// Pequeña variación que cambia cada día, para que las
// recomendaciones no sean siempre idénticas entre prendas
// parecidas. Dentro del mismo día es estable.
const getDailyJitter = (id) => {
  const now = new Date();

  const text =
    `${id}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  }

  return hash % 6;
};

// Reglas duras: prendas que directamente no sirven.
const isExcluded = (info, slot, p) => {
  // Muy abrigada cuando hace calor.
  if (p.effective >= 22 && info.warmth >= 3.5 && slot !== 'outer') {
    return true;
  }

  if (slot === 'bottom' && info.short && p.effective <= 15) {
    return true;
  }

  if (slot === 'top' && info.sleeveless && p.effective <= 14) {
    return true;
  }

  if (
    slot === 'footwear' &&
    info.open &&
    (p.effective <= 14 || p.rain || p.snow)
  ) {
    return true;
  }

  if (slot === 'onepiece' && p.effective <= 11 && info.warmth < 2) {
    return true;
  }

  if (slot === 'outer') {
    // Con calor y lluvia, solo sirve si protege del agua.
    if (p.rain && p.effective > 22 && !info.rainProtected) {
      return true;
    }

    // Con calor y sin lluvia, no sugerimos abrigos pesados.
    if (!p.rain && p.effective > 22 && info.warmth > 2) {
      return true;
    }

    if (p.snow && info.warmth < 3) {
      return true;
    }
  }

  return false;
};

const scoreCandidate = (entry, slot, p) => {
  const { info, id } = entry;

  if (isExcluded(info, slot, p)) {
    return -Infinity;
  }

  const target = TARGETS[p.band][slot];

  let score = 100 - Math.abs(info.warmth - target) * 30;

  if (slot === 'outer') {
    if (p.rain) {
      score += info.rainProtected ? 40 : -20;
    }

    if (p.windy && info.windproof) {
      score += 15;
    }

    if (p.snow && info.warmth >= 3) {
      score += 20;
    }
  }

  if (slot === 'footwear') {
    if ((p.rain || p.snow) && info.rainProtected) {
      score += 25;
    }

    if (p.rain && info.warmth >= 3) {
      score += 10;
    }

    if (p.snow && info.warmth >= 3) {
      score += 15;
    }
  }

  if (p.humid && p.effective > 22 && info.natural) {
    score += 10;
  }

  return score + getDailyJitter(id);
};


// ============================================================
// TEXTOS DE CADA RECOMENDACIÓN
// ============================================================

const getReason = (info, slot, p) => {
  const temp = `${Math.round(p.effective)}°C`;

  if (slot === 'outer') {
    if (p.rain && info.rainProtected) {
      return 'Te protege de la lluvia';
    }

    if (p.snow) {
      return 'Abrigo para la nieve';
    }

    if (p.windy && info.windproof) {
      return 'Corta el viento';
    }

    return `Capa adecuada para ${temp}`;
  }

  if (slot === 'footwear') {
    if (p.snow) {
      return 'Calzado cerrado para la nieve';
    }

    if (p.rain) {
      return info.rainProtected
        ? 'Aguanta bien el agua'
        : 'Calzado cerrado para no mojarte';
    }

    return `Cómodo para ${temp}`;
  }

  if (slot === 'accessory') {
    if (info.kind === 'cold') return 'Para protegerte del frío';
    if (info.kind === 'sun') return 'Para el sol';
    if (info.kind === 'rain') return 'Para la lluvia';
  }

  if (p.humid && p.effective > 22 && info.natural) {
    return 'Tela fresca para la humedad';
  }

  return `Adecuada para ${temp}`;
};


// ============================================================
// ACCESORIOS
// ============================================================

const pickAccessories = (classified, p) => {
  const wanted = [];

  if (p.snow || p.effective <= 5) {
    wanted.push({ kind: 'cold', count: 2 });
  } else if (p.effective <= 10) {
    wanted.push({ kind: 'cold', count: 1 });
  }

  if (p.clear && p.effective >= 20 && !p.rain) {
    wanted.push({ kind: 'sun', count: p.effective >= 26 ? 2 : 1 });
  }

  if (p.rain && !p.windy) {
    wanted.push({ kind: 'rain', count: 1 });
  }

  const result = [];

  wanted.forEach(({ kind, count }) => {
    const usedWords = new Set();

    classified
      .filter(
        (entry) =>
          entry.info.slot === 'accessory' &&
          entry.info.kind === kind
      )
      .sort((a, b) => getDailyJitter(b.id) - getDailyJitter(a.id))
      .forEach((entry) => {
        if (
          usedWords.size >= count ||
          usedWords.has(entry.info.word)
        ) {
          return;
        }

        usedWords.add(entry.info.word);
        result.push(entry);
      });
  });

  return result;
};


// ============================================================
// RANKING DE PRENDAS POR SLOT
// ============================================================

const classifyAll = (clothes) =>
  (Array.isArray(clothes) ? clothes : [])
    .map((item, index) => ({
      item,
      id: getItemId(item, index),
      info: classifyClothing(item),
    }))
    .filter((entry) => entry.info !== null);

// Prendas de un slot ordenadas de mejor a peor (solo las adecuadas).
const rankSlot = (classified, slot, profile) =>
  classified
    .filter((entry) => entry.info.slot === slot)
    .map((entry) => ({
      ...entry,
      score: scoreCandidate(entry, slot, profile),
    }))
    .filter((entry) => entry.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

const toRecommendation = (entry, slot, profile, reason) => ({
  item: entry.item,
  id: entry.id,
  slot,
  label: SLOT_LABELS[slot],
  reason: reason || getReason(entry.info, slot, profile),
});


// ============================================================
// COMBINACIÓN DE COLORES (bonus chico, no decide solo)
// ============================================================

const NEUTRAL_COLORS = [
  'negro', 'blanco', 'gris', 'beige', 'crema', 'marron', 'camel',
  'azul marino', 'celeste', 'jean', 'denim', 'nude', 'hueso',
  'topo', 'caqui', 'chocolate',
];

const isNeutralColor = (color) => {
  const c = normalizeText(color);
  return !c || NEUTRAL_COLORS.some((n) => c.includes(n));
};

const colorBonus = (a, b) => {
  const ca = normalizeText(a?.item?.color);
  const cb = normalizeText(b?.item?.color);

  if (!ca || !cb) return 0;
  if (isNeutralColor(ca) || isNeutralColor(cb)) return 6;
  if (ca === cb) return 2;

  // Dos colores fuertes distintos: puede funcionar, pero
  // preferimos combinaciones más fáciles.
  return -4;
};


// ============================================================
// FUNCIÓN PRINCIPAL: VARIOS OUTFITS + ALTERNATIVAS
// ============================================================

const MAIN_SLOTS = ['top', 'bottom', 'onepiece', 'outer', 'footwear'];

/**
 * Arma hasta `maxOutfits` outfits completos y distintos para el
 * mismo clima, más una lista de alternativas por cada parte.
 *
 * @returns {{
 *   outfits: Array<{ id: string, name: string, items: Array }>,
 *   alternatives: Object<string, Array>,
 *   missing: string[],
 *   profile: Object|null
 * }}
 */
export const buildOutfitOptions = (
  clothes,
  weather,
  { maxOutfits = 3, maxAlternatives = 4 } = {}
) => {
  const profile = buildWeatherProfile(weather);

  const empty = {
    outfits: [],
    alternatives: {},
    missing: [],
    profile,
  };

  if (!profile) {
    return empty;
  }

  const classified = classifyAll(clothes);

  if (classified.length === 0) {
    return empty;
  }

  const ranked = {};

  MAIN_SLOTS.forEach((slot) => {
    ranked[slot] =
      slot === 'outer' && !profile.needsOuter
        ? []
        : rankSlot(classified, slot, profile);
  });

  // ----------------------------------------------------------
  // BASES POSIBLES: arriba + abajo, o prenda completa
  // ----------------------------------------------------------

  const bases = [];

  ranked.top.slice(0, 5).forEach((top) => {
    ranked.bottom.slice(0, 5).forEach((bottom) => {
      bases.push({
        parts: [
          { entry: top, slot: 'top' },
          { entry: bottom, slot: 'bottom' },
        ],
        score: (top.score + bottom.score) / 2 + colorBonus(top, bottom),
      });
    });
  });

  ranked.onepiece.slice(0, 3).forEach((onepiece) => {
    bases.push({
      parts: [{ entry: onepiece, slot: 'onepiece' }],
      score: onepiece.score,
    });
  });

  bases.sort((a, b) => b.score - a.score);

  // ----------------------------------------------------------
  // ELEGIR BASES DISTINTAS ENTRE SÍ
  // ----------------------------------------------------------
  // 1ª pasada: que no repitan ninguna prenda.
  // 2ª pasada: se permite repetir una, pero no la combinación.

  const chosen = [];
  const usedIds = new Set();
  const usedKeys = new Set();

  const keyOf = (base) =>
    base.parts.map((part) => part.entry.id).sort().join('+');

  const tryAdd = (base, allowRepeat) => {
    if (chosen.length >= maxOutfits || usedKeys.has(keyOf(base))) {
      return;
    }

    const repeats = base.parts.filter((part) => usedIds.has(part.entry.id)).length;

    if (!allowRepeat && repeats > 0) return;
    if (allowRepeat && repeats >= base.parts.length) return;

    chosen.push(base);
    usedKeys.add(keyOf(base));
    base.parts.forEach((part) => usedIds.add(part.entry.id));
  };

  bases.forEach((base) => tryAdd(base, false));
  bases.forEach((base) => tryAdd(base, true));

  // ----------------------------------------------------------
  // COMPLETAR CADA OUTFIT (abrigo, calzado, accesorios)
  // ----------------------------------------------------------

  const accessories = pickAccessories(classified, profile);

  const pickRotating = (list, index) =>
    list.length > 0 ? list[index % list.length] : null;

  const outfits = chosen.map((base, index) => {
    const items = base.parts.map((part) =>
      toRecommendation(part.entry, part.slot, profile)
    );

    const outer = pickRotating(ranked.outer, index);
    const footwear = pickRotating(ranked.footwear, index);

    if (outer) items.push(toRecommendation(outer, 'outer', profile));
    if (footwear) items.push(toRecommendation(footwear, 'footwear', profile));

    accessories.forEach((entry) =>
      items.push(toRecommendation(entry, 'accessory', profile))
    );

    return {
      id: `opcion-${index + 1}`,
      name: `Opción ${index + 1}`,
      items,
    };
  });

  // Si no hubo base (ej. solo calzado y abrigos), igual mostramos
  // lo que haya en una única opción.
  if (outfits.length === 0) {
    const items = [];
    const outer = ranked.outer[0];
    const footwear = ranked.footwear[0];

    if (outer) items.push(toRecommendation(outer, 'outer', profile));
    if (footwear) items.push(toRecommendation(footwear, 'footwear', profile));
    accessories.forEach((entry) =>
      items.push(toRecommendation(entry, 'accessory', profile))
    );

    if (items.length > 0) {
      outfits.push({ id: 'opcion-1', name: 'Opción 1', items });
    }
  }

  // ----------------------------------------------------------
  // ALTERNATIVAS POR PARTE
  // ----------------------------------------------------------

  const alternatives = {};

  MAIN_SLOTS.forEach((slot) => {
    alternatives[slot] = ranked[slot]
      .slice(0, maxAlternatives)
      .map((entry) => toRecommendation(entry, slot, profile));
  });

  // ----------------------------------------------------------
  // QUÉ FALTA PARA COMPLETAR EL OUTFIT
  // ----------------------------------------------------------

  const missing = [];
  const hasOnePiece = ranked.onepiece.length > 0;

  if (!hasOnePiece || (ranked.top.length > 0 && ranked.bottom.length > 0)) {
    if (ranked.top.length === 0 && !hasOnePiece) {
      missing.push('una prenda adecuada para la parte de arriba');
    }

    if (ranked.bottom.length === 0 && !hasOnePiece) {
      missing.push('una prenda adecuada para la parte de abajo');
    }
  }

  if (profile.needsOuter && ranked.outer.length === 0) {
    if (profile.rain) {
      missing.push('un piloto o campera impermeable');
    } else if (profile.snow) {
      missing.push('un abrigo para la nieve');
    } else {
      missing.push('un abrigo');
    }
  }

  if (ranked.footwear.length === 0) {
    missing.push(
      profile.rain || profile.snow ? 'calzado cerrado' : 'calzado'
    );
  }

  return { outfits, alternatives, missing, profile };
};


/**
 * Versión simple (una sola recomendación). Se mantiene para
 * no romper código que ya la usaba.
 */
export const buildOutfitRecommendation = (clothes, weather) => {
  const { outfits, missing, profile } = buildOutfitOptions(clothes, weather, {
    maxOutfits: 1,
  });

  return {
    items: outfits[0]?.items || [],
    missing,
    profile,
  };
};


// ============================================================
// CAPAS PARA MÁS TARDE (días que cambian mucho)
// ============================================================
//
// `hours` sale de getRestOfDayForecast (services/forecastService):
//   [{ hour, temp, feelsLike, rainProb }]
//
// Devuelve sugerencias del estilo:
//   { item, id, slot, label, reason, icon }
// `item` puede ser null cuando es solo un consejo.

const formatHour = (hour) => `${pad2Hour(hour)} h`;
const pad2Hour = (h) => String(h).padStart(2, '0');

export const buildLayerSuggestions = (
  clothes,
  weather,
  hours,
  outfitItems = []
) => {
  const profile = buildWeatherProfile(weather);

  if (!profile || !Array.isArray(hours) || hours.length < 2) {
    return [];
  }

  // Desde la próxima hora en adelante.
  const later = hours.slice(1);
  const classified = classifyAll(clothes);
  const usedIds = new Set(outfitItems.map((entry) => String(entry.id)));
  const notUsed = (entry) => !usedIds.has(String(entry.id));

  const coldest = later.reduce((a, b) => (b.feelsLike < a.feelsLike ? b : a));
  const warmest = later.reduce((a, b) => (b.feelsLike > a.feelsLike ? b : a));
  const wettest = later.reduce((a, b) =>
    (b.rainProb || 0) > (a.rainProb || 0) ? b : a
  );

  const suggestions = [];

  // ----------------------------------------------------------
  // 1) MÁS TARDE REFRESCA
  // ----------------------------------------------------------

  const drop = profile.effective - coldest.feelsLike;

  if (drop >= 4 && coldest.feelsLike <= 18) {
    const colder = {
      ...profile,
      effective: coldest.feelsLike,
      band: getBand(coldest.feelsLike),
      needsOuter: true,
    };

    const temp = `${Math.round(coldest.feelsLike)}°C`;
    const reason = `A las ${formatHour(coldest.hour)} baja a ${temp}`;

    // Preferimos un abrigo; si el outfit ya tiene uno, un buzo
    // o cárdigan para sumar debajo.
    const hasOuter = outfitItems.some((entry) => entry.slot === 'outer');

    const pick =
      (!hasOuter && rankSlot(classified, 'outer', colder).find(notUsed)) ||
      rankSlot(classified, 'top', colder).find(
        (entry) => notUsed(entry) && entry.info.warmth >= 2
      );

    suggestions.push(
      pick
        ? {
            ...toRecommendation(pick, pick.info.slot, colder, reason),
            label: 'Para más tarde',
            icon: 'thermometer-outline',
          }
        : {
            item: null,
            id: 'tip-cold',
            slot: 'tip',
            label: 'Para más tarde',
            reason: `${reason}: llevá algo de abrigo.`,
            icon: 'thermometer-outline',
          }
    );
  }

  // ----------------------------------------------------------
  // 2) MÁS TARDE PUEDE LLOVER
  // ----------------------------------------------------------

  if (!profile.rain && (wettest.rainProb || 0) >= 50) {
    const reason =
      `${Math.round(wettest.rainProb)}% de probabilidad de lluvia ` +
      `a las ${formatHour(wettest.hour)}`;

    const pick =
      classified.find(
        (entry) =>
          entry.info.slot === 'accessory' &&
          entry.info.kind === 'rain' &&
          notUsed(entry)
      ) ||
      classified.find(
        (entry) =>
          entry.info.slot === 'outer' &&
          entry.info.rainProtected &&
          notUsed(entry)
      );

    suggestions.push(
      pick
        ? {
            ...toRecommendation(pick, pick.info.slot, profile, reason),
            label: 'Por si llueve',
            icon: 'umbrella-outline',
          }
        : {
            item: null,
            id: 'tip-rain',
            slot: 'tip',
            label: 'Por si llueve',
            reason: `${reason}: conviene llevar paraguas o algo impermeable.`,
            icon: 'umbrella-outline',
          }
    );
  }

  // ----------------------------------------------------------
  // 3) MÁS TARDE SUBE MUCHO LA TEMPERATURA
  // ----------------------------------------------------------

  const rise = warmest.feelsLike - profile.effective;

  if (rise >= 5 && warmest.feelsLike >= 22) {
    const temp = `${Math.round(warmest.feelsLike)}°C`;

    suggestions.push({
      item: null,
      id: 'tip-warm',
      slot: 'tip',
      label: 'Más tarde sube',
      reason:
        `A las ${formatHour(warmest.hour)} llega a ${temp}: ` +
        'vestite en capas que te puedas sacar.',
      icon: 'sunny-outline',
    });
  }

  return suggestions;
};


// ============================================================
// MODO MALETA: CANTIDADES RECOMENDADAS Y SUGERENCIAS
// ============================================================
//
// Reglas fijas acordadas para un viaje de N días:
//   - Parte de arriba: 1 por día (máximo 7, después se repite)
//   - Parte de abajo: 1 cada 2 días (mínimo 1)
//   - Calzado: 2 (3 si el viaje dura más de 7 días)
//   - Abrigo: 1
//   - Accesorios: 1
//
// `tripSummary` es opcional (null): sin él, las cantidades salen solo de los días.

export const PACKING_SLOTS = ['top', 'bottom', 'outer', 'footwear', 'accessory'];

export const getSlotLabel = (slot) => SLOT_LABELS[slot] || 'Prenda';

// Slot de una prenda (o null si no la reconocemos).
export const getClothingSlot = (item) => classifyClothing(item)?.slot || null;

export const getPackingQuantities = (tripDays, tripSummary = null) => {
  const days = Math.max(1, Math.round(Number(tripDays) || 1));

  const coldest = tripSummary ? tripSummary.feelsMin : null;
  const warmest = tripSummary ? tripSummary.feelsMax : null;
  const rainy = tripSummary ? tripSummary.rainyDays > 0 : false;

  let outer = 1;

  if (coldest !== null) {
    if (coldest <= 5) outer = 2;
    else if (coldest <= 18) outer = 1;
    else outer = rainy ? 1 : 0;
  }

  let accessory = 1;

  if (coldest !== null && warmest !== null) {
    const needsCold = coldest <= 10;
    const needsSun = warmest >= 24;
    accessory = Math.min(2, Number(needsCold) + Number(needsSun) + Number(rainy)) || 1;
  }

  return {
    top: Math.min(days, 7),
    bottom: Math.max(1, Math.ceil(days / 2)),
    outer,
    footwear: days > 7 ? 3 : 2,
    accessory,
  };
};

/**
 * Elige del armario qué llevar, respetando las cantidades.
 *
 * @returns {{ quantities, picks: Object<slot, Array<{item,id,reason}>>, missing: string[] }}
 */
export const buildPackingSuggestion = (clothes, tripDays, tripSummary = null) => {
  const quantities = getPackingQuantities(tripDays, tripSummary);
  const classified = classifyAll(clothes);

  // Usamos la temperatura promedio del viaje para elegir
  // prendas; si hay días fríos, el abrigo se elige pensando
  // en el día más frío.
  const avgProfile = buildWeatherProfile({
    temp: tripSummary ? tripSummary.feelsAvg : 18,
    feelsLike: tripSummary ? tripSummary.feelsAvg : 18,
    conditionGroup: tripSummary && tripSummary.rainyDays > 0 ? 'Rain' : 'Clouds',
  });

  const coldProfile = buildWeatherProfile({
    temp: tripSummary ? tripSummary.feelsMin : 12,
    feelsLike: tripSummary ? tripSummary.feelsMin : 12,
    conditionGroup: tripSummary && tripSummary.rainyDays > 0 ? 'Rain' : 'Clouds',
  });

  const picks = {};
  const missing = [];

  PACKING_SLOTS.forEach((slot) => {
    const wanted = quantities[slot];

    if (!wanted) {
      picks[slot] = [];
      return;
    }

    let ranked;

    if (slot === 'accessory') {
      const kinds = [];
      if (tripSummary && tripSummary.feelsMin <= 10) kinds.push('cold');
      if (tripSummary && tripSummary.feelsMax >= 24) kinds.push('sun');
      if (tripSummary && tripSummary.rainyDays > 0) kinds.push('rain');

      // Solo accesorios útiles para el clima del viaje
      // (sin pronóstico, cualquiera sirve).
      ranked = classified.filter(
        (entry) =>
          entry.info.slot === 'accessory' &&
          (kinds.length === 0 || kinds.includes(entry.info.kind))
      );
    } else {
      const profile = slot === 'outer' ? coldProfile : avgProfile;
      ranked = rankSlot(classified, slot, profile);
    }

    // Variedad: evitamos repetir el mismo tipo de prenda
    // (ej. 3 jeans) mientras haya otras opciones.
    const chosen = [];
    const words = new Set();

    ranked.forEach((entry) => {
      if (chosen.length < wanted && !words.has(entry.info.word)) {
        chosen.push(entry);
        words.add(entry.info.word);
      }
    });

    ranked.forEach((entry) => {
      if (chosen.length < wanted && !chosen.includes(entry)) {
        chosen.push(entry);
      }
    });

    picks[slot] = chosen.map((entry) => ({
      item: entry.item,
      id: entry.id,
      reason: getReason(entry.info, slot, slot === 'outer' ? coldProfile : avgProfile),
    }));

    if (chosen.length < wanted) {
      missing.push(`${wanted - chosen.length} ${getSlotLabel(slot).toLowerCase()}`);
    }
  });

  return { quantities, picks, missing };
};
