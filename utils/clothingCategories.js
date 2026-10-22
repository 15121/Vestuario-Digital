// ============================================================
// CATEGORÍAS DE PRENDAS
// ============================================================
//
// Ubicación: utils/clothingCategories.js
//
// Movido sin cambios desde screens/createOufitScreen.js para que
// también lo usen el detalle de prenda ("Combina con…") y el
// botón "Sorprendeme".
// ============================================================

// ============================================================
// NORMALIZACIÓN DE CATEGORÍAS
// Permite trabajar aunque en la base se haya guardado:
// "Superior", "superior", "Camisa", etc.
// ============================================================

export const normalizeCategory = (category = '') => {
  return category
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// ============================================================
// CLASIFICACIÓN DE PRENDAS
// ============================================================

export const isUpper = (category) => {
  const value = normalizeCategory(category);

  const exactCategories = [
    'superior',
    'superiores',

    'camiseta',
    'camisetas',
    'top',
    'tops',
    'camisetas / tops',

    'camisa',
    'camisas',
    'camisas / blusas',

    'blusa',
    'blusas',

    'abrigo',
    'abrigos',

    'buzo',
    'buzos / sweaters',

    'sweater',
    'sweaters',

    'chaqueta',
    'chaquetas',

    'campera',
    'camperas',

    // Prendas de una sola pieza / conjuntos
    'vestido',
    'vestidos',
    'traje',
    'trajes',
    'conjunto',
    'conjuntos',
    'trajes / conjuntos',

    // Ropa interior superior
    'ropa interior superior',
    'lenceria superior',
    'sosten',
    'corpiño',
  ];

  if (exactCategories.includes(value)) {
    return true;
  }

  // Categorías personalizadas.
  // Se utilizan palabras clave para evitar que una categoría
  // escrita de otra forma quede fuera del selector.
  return [
    'camis',
    'remer',
    'blus',
    'top',
    'camisa',
    'chomb',
    'polo',
    'buz',
    'sweater',
    'sueter',
    'pulover',
    'cardigan',
    'chaquet',
    'camper',
    'saco',
    'abrigo',
    'tapado',
    'vestid',
    'traje',
    'conjunto',
    'corpi',
    'sosten',
  ].some((keyword) => value.includes(keyword));
};

export const isOnePiece = (category) => {
  const value = normalizeCategory(category);

  return [
    'vestido',
    'vestidos',
    'traje',
    'trajes',
    'conjunto',
    'conjuntos',
    'trajes / conjuntos',
    'mono',
    'monos',
  ].includes(value);
};

export const isLower = (category) => {
  const value = normalizeCategory(category);

  const exactCategories = [
    'inferior',
    'inferiores',

    'pantalon',
    'pantalones',

    'jean',
    'jeans',

    'short',
    'shorts',

    'falda',
    'faldas',

    'pollera',
    'polleras',

    'bermuda',
    'bermudas',

    'calza',
    'calzas',

    'legging',
    'leggings',

    'jogger',
    'joggers',

    // Ropa interior
    'ropa interior',
    'ropa interior inferior',
  ];

  if (exactCategories.includes(value)) {
    return true;
  }

  // "calza" está dentro de "calzado": sin esto, los zapatos
  // aparecían también como prenda inferior.
  if (value.includes('calzad')) {
    return false;
  }

  return [
    'pantal',
    'jean',
    'short',
    'falda',
    'poller',
    'bermuda',
    'calza',
    'legging',
    'jogger',
    'boxer',
    'bombacha',
    'bombachas',
  ].some((keyword) => value.includes(keyword));
};

export const isShoes = (category) => {
  const value = normalizeCategory(category);

  const exactCategories = [
    'calzado',
    'calzados',
    'zapato',
    'zapatos',
    'zapatilla',
    'zapatillas',
    'bota',
    'botas',
    'sandalia',
    'sandalias',
    'chancla',
    'chanclas',
    'ojota',
    'ojotas',
    'mocasín',
    'mocasines',
    'zueco',
    'zuecos',
  ];

  if (exactCategories.includes(value)) {
    return true;
  }

  return [
    'calzad',
    'zapat',
    'zapato',
    'bot',
    'sandali',
    'chancl',
    'ojot',
    'mocasin',
    'zuec',
  ].some((keyword) => value.includes(keyword));
};

export const isAccessory = (category) => {
  const value = normalizeCategory(category);

  const exactCategories = [
    'accesorio',
    'accesorios',
    'accesory',
    'accesories',

    'cartera',
    'carteras',

    'bolso',
    'bolsos',

    'mochila',
    'mochilas',

    'reloj',
    'relojes',

    'cinturon',
    'cinturones',

    'correa',
    'correas',

    'gorra',
    'gorras',

    'sombrero',
    'sombreros',

    'bufanda',
    'bufandas',

    'lentes',
    'anteojos',

    'collar',
    'collares',

    'pulsera',
    'pulseras',

    'anillo',
    'anillos',

    'corbata',
    'corbatas',

    'panuelo',
    'panuelos',
  ];

  if (exactCategories.includes(value)) {
    return true;
  }

  return [
    'accesor',
    'carter',
    'bols',
    'mochil',
    'reloj',
    'cinturon',
    'correa',
    'gorra',
    'sombrer',
    'bufand',
    'lente',
    'anteoj',
    'collar',
    'pulser',
    'anill',
    'corbat',
    'panuelo',
  ].some((keyword) => value.includes(keyword));
};
