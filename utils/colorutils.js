// utils/colorutils.js
//
// Fuente ÚNICA de colores de la app.
//
// - En la base de datos se guarda solamente el NOMBRE ("Rojo oscuro").
// - El RGB / HEX se usa solo para mostrar el puntito de color y para
//   detectar el color más cercano con el selector de la imagen.
//
// Add/Edit de prendas, listado, detalle, outfits, clima y maleta
// deben usar estas funciones en vez de tener su propio mapa.

export const MULTICOLOR_NAME = 'Multicolor';

// Los nombres ya existentes NO se cambian: en la base de datos se
// guarda el nombre, y las prendas viejas tienen que seguir viéndose.
//
// `detect: false` = se puede elegir a mano, pero el detector de
// color de la foto no lo sugiere (por ejemplo "Plateado", que se
// confundiría con cualquier gris claro).

export const COLOR_OPTIONS = [
  // Neutros
  { name: 'Negro', rgb: [0, 0, 0] },
  { name: 'Blanco', rgb: [255, 255, 255] },
  { name: 'Hueso', rgb: [241, 236, 224] },
  { name: 'Gris oscuro', rgb: [75, 85, 99] },
  { name: 'Gris', rgb: [128, 128, 128] },
  { name: 'Gris claro', rgb: [209, 213, 219] },
  { name: 'Gris topo', rgb: [120, 108, 96] },

  // Rojos
  { name: 'Rojo', rgb: [220, 38, 38] },
  { name: 'Rojo oscuro', rgb: [153, 27, 27] },
  { name: 'Bordó', rgb: [110, 22, 40] },
  { name: 'Coral', rgb: [255, 111, 97] },
  { name: 'Terracota', rgb: [196, 90, 61] },

  // Rosas
  { name: 'Fucsia', rgb: [217, 30, 140] },
  { name: 'Rosa', rgb: [236, 72, 153] },
  { name: 'Rosa claro', rgb: [249, 168, 212] },
  { name: 'Rosa viejo', rgb: [196, 138, 145] },
  { name: 'Salmón', rgb: [250, 160, 130] },
  { name: 'Nude', rgb: [227, 188, 163] },

  // Naranjas y amarillos
  { name: 'Naranja', rgb: [249, 115, 22] },
  { name: 'Durazno', rgb: [255, 190, 152] },
  { name: 'Mostaza', rgb: [200, 150, 30] },
  { name: 'Amarillo', rgb: [234, 179, 8] },
  { name: 'Amarillo claro', rgb: [253, 230, 138] },
  { name: 'Crema', rgb: [255, 247, 214] },

  // Verdes
  { name: 'Verde', rgb: [22, 163, 74] },
  { name: 'Verde oscuro', rgb: [22, 101, 52] },
  { name: 'Verde claro', rgb: [134, 239, 172] },
  { name: 'Verde manzana', rgb: [141, 198, 63] },
  { name: 'Verde oliva', rgb: [107, 112, 48] },
  { name: 'Verde militar', rgb: [75, 83, 32] },
  { name: 'Verde agua', rgb: [125, 212, 190] },

  // Azules
  { name: 'Turquesa', rgb: [20, 184, 166] },
  { name: 'Celeste', rgb: [56, 189, 248] },
  { name: 'Celeste claro', rgb: [186, 230, 253] },
  { name: 'Azul jean', rgb: [74, 104, 145] },
  { name: 'Azul francia', rgb: [49, 100, 230] },
  { name: 'Azul', rgb: [30, 64, 175] },
  { name: 'Azul oscuro', rgb: [30, 58, 138] },
  { name: 'Azul marino', rgb: [20, 33, 61] },

  // Violetas
  { name: 'Violeta', rgb: [156, 78, 221] },
  { name: 'Lila', rgb: [196, 181, 253] },
  { name: 'Púrpura', rgb: [102, 30, 120] },

  // Marrones
  { name: 'Marrón', rgb: [146, 64, 14] },
  { name: 'Chocolate', rgb: [92, 51, 23] },
  { name: 'Camel', rgb: [193, 140, 80] },
  { name: 'Beige', rgb: [212, 185, 150] },
  { name: 'Caqui', rgb: [176, 160, 110] },

  // Metalizados (solo a mano)
  { name: 'Dorado', rgb: [212, 175, 55], detect: false },
  { name: 'Plateado', rgb: [192, 192, 192], detect: false },

  { name: MULTICOLOR_NAME, rgb: null },
];

// ------------------------------------------------------------
// Normalización: sin tildes, minúsculas, espacios simples
// ------------------------------------------------------------

export const normalizeColorName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

// ------------------------------------------------------------
// Conversión
// ------------------------------------------------------------

const toHexPart = (n) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');

export const rgbToHex = (rgb) =>
  Array.isArray(rgb)
    ? `#${toHexPart(rgb[0])}${toHexPart(rgb[1])}${toHexPart(rgb[2])}`.toUpperCase()
    : null;

export const rgbToCss = (rgb) =>
  Array.isArray(rgb) ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : null;

// ------------------------------------------------------------
// Mapa nombre normalizado -> HEX (derivado de COLOR_OPTIONS)
// ------------------------------------------------------------

export const COLOR_HEX = COLOR_OPTIONS.reduce((map, option) => {
  map[normalizeColorName(option.name)] = option.rgb
    ? rgbToHex(option.rgb)
    : '#8E44AD'; // Multicolor
  return map;
}, {});

// Nombres que pueden venir de datos viejos o escritos a mano
const COLOR_ALIASES = {
  black: 'negro',
  white: 'blanco',
  gray: 'gris',
  grey: 'gris',
  plomo: 'gris',
  grisclaro: 'gris claro',
  grisoscuro: 'gris oscuro',
  topo: 'gris topo',
  red: 'rojo',
  bordeaux: 'bordo',
  vino: 'bordo',
  rosado: 'rosa',
  pink: 'rosa',
  blue: 'azul',
  navy: 'azul marino',
  marino: 'azul marino',
  jean: 'azul jean',
  denim: 'azul jean',
  cyan: 'celeste',
  green: 'verde',
  oliva: 'verde oliva',
  militar: 'verde militar',
  yellow: 'amarillo',
  orange: 'naranja',
  purple: 'violeta',
  morado: 'violeta',
  brown: 'marron',
  cafe: 'marron',
  kaki: 'caqui',
  khaki: 'caqui',
  gold: 'dorado',
  silver: 'plateado',
  multi: 'multicolor',
  'multi color': 'multicolor',
};

// Colores que no están en la lista fija pero conviene dibujar
const EXTRA_HEX = {};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// HEX para mostrar el puntito de color de una prenda.
// Acepta nombre ("Azul oscuro"), alias viejo ("black") o HEX directo.
export const getColorHex = (color, fallback = '#CBD5E1') => {
  if (!color) {
    return fallback;
  }

  const raw = String(color).trim();

  if (HEX_RE.test(raw)) {
    return raw;
  }

  const key = normalizeColorName(raw);

  return (
    COLOR_HEX[key] ||
    COLOR_HEX[COLOR_ALIASES[key]] ||
    EXTRA_HEX[key] ||
    fallback
  );
};

export const isMulticolor = (color) =>
  normalizeColorName(color) === normalizeColorName(MULTICOLOR_NAME);

// ------------------------------------------------------------
// Detección del color más cercano a un píxel (selector de imagen)
// ------------------------------------------------------------

const colorDistance = (a, b) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

export const findClosestColor = (r, g, b) => {
  const sample = [r, g, b];

  let closest = COLOR_OPTIONS.find((option) => option.rgb && option.detect !== false);
  let best = Infinity;

  COLOR_OPTIONS.forEach((option) => {
    if (!option.rgb || option.detect === false) {
      return;
    }

    const distance = colorDistance(sample, option.rgb);

    if (distance < best) {
      best = distance;
      closest = option;
    }
  });

  return closest;
};
