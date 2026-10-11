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
// FUNCIÓN PRINCIPAL
// ============================================================

/**
 * @param {Array} clothes - Prendas del usuario.
 * @param {Object} weather - Resultado de getWeatherByCity.
 * @returns {{
 *   items: Array<{item: Object, id: string, slot: string, label: string, reason: string}>,
 *   missing: string[],
 *   profile: Object|null
 * }}
 */
export const buildOutfitRecommendation = (clothes, weather) => {
  const profile = buildWeatherProfile(weather);

  const empty = { items: [], missing: [], profile };

  if (!profile || !Array.isArray(clothes) || clothes.length === 0) {
    return empty;
  }

  const classified = clothes
    .map((item, index) => ({
      item,
      id: getItemId(item, index),
      info: classifyClothing(item),
    }))
    .filter((entry) => entry.info !== null);

  if (classified.length === 0) {
    return empty;
  }

  const pickBest = (slot) => {
    let best = null;

    classified.forEach((entry) => {
      if (entry.info.slot !== slot) {
        return;
      }

      const score = scoreCandidate(entry, slot, profile);

      if (score < MIN_SCORE) {
        return;
      }

      if (!best || score > best.score) {
        best = { ...entry, score };
      }
    });

    return best;
  };

  const top = pickBest('top');
  const bottom = pickBest('bottom');
  const onepiece = pickBest('onepiece');
  const outer = profile.needsOuter ? pickBest('outer') : null;
  const footwear = pickBest('footwear');

  // Prenda completa vs. combinación arriba + abajo.
  const useOnePiece =
    onepiece &&
    (!top ||
      !bottom ||
      onepiece.score >= (top.score + bottom.score) / 2);

  const items = [];

  const push = (entry, slot) => {
    if (!entry) {
      return;
    }

    items.push({
      item: entry.item,
      id: entry.id,
      slot,
      label: SLOT_LABELS[slot],
      reason: getReason(entry.info, slot, profile),
    });
  };

  if (useOnePiece) {
    push(onepiece, 'onepiece');
  } else {
    push(top, 'top');
    push(bottom, 'bottom');
  }

  push(outer, 'outer');
  push(footwear, 'footwear');

  pickAccessories(classified, profile).forEach((entry) =>
    push(entry, 'accessory')
  );


  // ----------------------------------------------------------
  // QUÉ FALTA PARA COMPLETAR EL OUTFIT
  // ----------------------------------------------------------

  const missing = [];

  if (!useOnePiece) {
    if (!top) {
      missing.push('una prenda adecuada para la parte de arriba');
    }

    if (!bottom) {
      missing.push('una prenda adecuada para la parte de abajo');
    }
  }

  if (profile.needsOuter && !outer) {
    if (profile.rain) {
      missing.push('un piloto o campera impermeable');
    } else if (profile.snow) {
      missing.push('un abrigo para la nieve');
    } else {
      missing.push('un abrigo');
    }
  }

  if (!footwear) {
    missing.push(
      profile.rain || profile.snow ? 'calzado cerrado' : 'calzado'
    );
  }

  return { items, missing, profile };
};
