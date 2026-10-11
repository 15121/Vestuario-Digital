import { getUserClothes } from './database';
import { MESSAGES } from '../theme/messages';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

// Devuelve el mensaje del primer campo vacío, o null si todo está bien.
// La descripción es el único campo opcional.
export const validateClothingForm = ({
  title,
  imageUri,
  category,
  color,
  season,
  ocasion,
}) => {
  if (!String(title || '').trim()) return MESSAGES.CLOTHING_TITLE_REQUIRED;
  if (!imageUri) return MESSAGES.CLOTHING_IMAGE_REQUIRED;
  if (!String(category || '').trim()) return MESSAGES.CLOTHING_CATEGORY_REQUIRED;
  if (!String(color || '').trim()) return MESSAGES.CLOTHING_COLOR_REQUIRED;
  if (!String(season || '').trim()) return MESSAGES.CLOTHING_SEASON_REQUIRED;
  if (!String(ocasion || '').trim()) return MESSAGES.CLOTHING_OCASION_REQUIRED;
  return null;
};

// Duplicada = el mismo usuario ya tiene otra prenda con igual
// nombre + categoría + color (sin importar mayúsculas ni tildes).
export const findDuplicateClothing = async (userId, candidate, ignoreId = null) => {
  if (userId === null || userId === undefined) return null;

  const clothes = await getUserClothes(userId);

  return (
    (clothes || []).find(
      (item) =>
        String(item.id) !== String(ignoreId) &&
        normalize(item.title) === normalize(candidate.title) &&
        normalize(item.category) === normalize(candidate.category) &&
        normalize(item.color) === normalize(candidate.color)
    ) || null
  );
};
