// ============================================================
// OUTFITS REPETIDOS
// ============================================================
//
// Ubicación: utils/outfitDuplicates.js
//
// Compara las prendas de un outfit nuevo con los que el usuario
// ya tiene guardados. Dos outfits son "el mismo" si tienen
// exactamente las mismas prendas (superior, inferior, calzado y
// accesorios, sin importar el orden de los accesorios).
//
// Solo lee los outfits: no guarda nada.
// ============================================================

const idOrEmpty = (value) =>
  value === null || value === undefined || value === '' ? '' : String(value);

const parseItems = (items) => {
  if (typeof items === 'string') {
    try {
      return JSON.parse(items) || {};
    } catch (error) {
      return {};
    }
  }

  return items && typeof items === 'object' ? items : {};
};

export const outfitSignature = (rawItems) => {
  const items = parseItems(rawItems);

  const accessories = (Array.isArray(items.accesorios) ? items.accesorios : [])
    .map(idOrEmpty)
    .filter(Boolean)
    .sort();

  return [
    idOrEmpty(items.superior),
    idOrEmpty(items.inferior),
    idOrEmpty(items.calzado),
    accessories.join(','),
  ].join('|');
};

/**
 * Devuelve el outfit guardado con las mismas prendas, o null.
 *
 * @param {Object} items - { superior, inferior, calzado, accesorios }
 * @param {Array} outfits - outfits del usuario
 * @param {*} ignoreId - id a ignorar (el outfit que se está editando)
 */
export const findDuplicateOutfit = (items, outfits, ignoreId = null) => {
  const signature = outfitSignature(items);

  return (
    (Array.isArray(outfits) ? outfits : []).find(
      (outfit) =>
        String(outfit?.id) !== String(ignoreId) &&
        outfitSignature(outfit?.items) === signature
    ) || null
  );
};
