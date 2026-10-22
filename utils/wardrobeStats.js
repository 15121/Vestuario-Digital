// ============================================================
// ESTADÍSTICAS DEL ARMARIO
// ============================================================
//
// Ubicación: utils/wardrobeStats.js
//
// Calcula todo en el momento a partir de lo que la app ya
// guarda (prendas, outfits e historial de outfits usados).
// No escribe nada en la base de datos.
//
// Cómo se cuenta el uso de una prenda:
//   cada vez que se registra un outfit como "usado" (historial),
//   sumamos 1 a cada prenda que forma parte de ese outfit
//   (superior, inferior, calzado y accesorios).
// ============================================================

const sameId = (a, b) =>
  a !== null && a !== undefined && b !== null && b !== undefined &&
  String(a) === String(b);

const getOutfitClothingIds = (outfit) => {
  const items =
    outfit?.items && typeof outfit.items === 'object' && !Array.isArray(outfit.items)
      ? outfit.items
      : {};

  const ids = [items.superior, items.inferior, items.calzado];

  if (Array.isArray(items.accesorios)) {
    ids.push(...items.accesorios);
  }

  return ids.filter((id) => id !== null && id !== undefined && id !== '');
};

const cleanLabel = (value, fallback) => {
  const text = String(value || '').trim();
  return text || fallback;
};

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

// Agrupa y cuenta: [{ name, count, percent }]
const countBy = (list, getKey, fallback) => {
  const map = new Map();

  list.forEach((entry) => {
    const raw = cleanLabel(getKey(entry), fallback);
    const key = raw.toLowerCase();
    const current = map.get(key) || { name: capitalize(raw), count: 0 };
    current.count += 1;
    map.set(key, current);
  });

  const total = list.length || 1;

  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .map((entry) => ({
      ...entry,
      percent: Math.round((entry.count / total) * 100),
    }));
};


/**
 * @returns {{
 *   totals: { clothes, outfits, uses, usedClothes, usedPercent },
 *   mostUsed: Array<{ item, uses }>,
 *   neverUsed: Array<{ item }>,
 *   colors: Array<{ name, count, percent }>,
 *   categories: Array<{ name, count, percent }>,
 *   favoriteOutfit: { name, uses } | null
 * }}
 */
export const buildWardrobeStats = (clothes, outfits, history) => {
  const clothesList = Array.isArray(clothes) ? clothes : [];
  const outfitList = Array.isArray(outfits) ? outfits : [];
  const historyList = Array.isArray(history) ? history : [];

  // ----------------------------------------------------------
  // USOS POR PRENDA Y POR OUTFIT
  // ----------------------------------------------------------

  const usesByClothing = new Map();
  const usesByOutfit = new Map();

  historyList.forEach((entry) => {
    const outfit = outfitList.find((o) => sameId(o.id, entry.outfitId));

    const outfitKey = String(entry.outfitId ?? entry.outfitName ?? '');
    const outfitName = outfit?.name || entry.outfitName || 'Outfit';
    const currentOutfit = usesByOutfit.get(outfitKey) || { name: outfitName, uses: 0 };
    currentOutfit.uses += 1;
    usesByOutfit.set(outfitKey, currentOutfit);

    if (!outfit) return;

    // Una prenda cuenta una sola vez por uso del outfit.
    new Set(getOutfitClothingIds(outfit).map(String)).forEach((id) => {
      usesByClothing.set(id, (usesByClothing.get(id) || 0) + 1);
    });
  });

  const withUses = clothesList.map((item) => ({
    item,
    uses: usesByClothing.get(String(item.id)) || 0,
  }));

  const mostUsed = withUses
    .filter((entry) => entry.uses > 0)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 5);

  // Las que nunca se usaron, empezando por las más antiguas.
  const neverUsed = withUses
    .filter((entry) => entry.uses === 0)
    .sort((a, b) =>
      String(a.item.createdAt || a.item.id).localeCompare(
        String(b.item.createdAt || b.item.id),
        undefined,
        { numeric: true }
      )
    )
    .slice(0, 8)
    .map(({ item }) => ({ item }));

  const usedClothes = withUses.filter((entry) => entry.uses > 0).length;

  const favoriteOutfit =
    [...usesByOutfit.values()].sort((a, b) => b.uses - a.uses)[0] || null;

  return {
    totals: {
      clothes: clothesList.length,
      outfits: outfitList.length,
      uses: historyList.length,
      usedClothes,
      usedPercent: clothesList.length
        ? Math.round((usedClothes / clothesList.length) * 100)
        : 0,
    },
    mostUsed,
    neverUsed,
    colors: countBy(clothesList, (item) => item.color, 'Sin color').slice(0, 6),
    categories: countBy(
      clothesList,
      (item) => item.category || item.categoria,
      'Sin categoría'
    ).slice(0, 6),
    favoriteOutfit,
  };
};
