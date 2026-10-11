// utils/dateUtils.js
// Devuelve siempre DD/MM/YYYY, sin hora.
export const formatDateOnly = (value) => {
  if (!value) return '';

  const text = String(value).trim();

  // Ya viene como DD/MM/YYYY (con o sin hora): nos quedamos con la fecha
  if (/^\d{2}\/\d{2}\/\d{4}/.test(text)) return text.slice(0, 10);

  // Fecha sola YYYY-MM-DD: se arma a mano para evitar el desfase UTC
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};
