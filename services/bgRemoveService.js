// ============================================================
// SERVICIO DE ELIMINACIÓN DE FONDO (remove.bg)
// Funciona en Celular (iOS/Android) y en Web (PC).
// ============================================================
import { Platform, Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const REMOVE_BG_API_KEY = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY;

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';

// En celular reducimos las fotos grandes de la cámara para que
// la subida sea rápida y no falle por tamaño.
const MAX_MOBILE_WIDTH = 1600;
const REQUEST_TIMEOUT_MS = 60000;

// ------------------------------------------------------------
// Mensajes claros según el error que devuelva remove.bg
// ------------------------------------------------------------
const getFriendlyError = (status, json) => {
  const code = json?.errors?.[0]?.code;
  const title = json?.errors?.[0]?.title;

  if (status === 402 || code === 'insufficient_credits') {
    return 'Se agotaron los créditos de remove.bg.';
  }
  if (status === 403 || code === 'auth_failed') {
    return 'La API key de remove.bg no es válida.';
  }
  if (status === 429 || code === 'rate_limit') {
    return 'Demasiadas solicitudes seguidas. Esperá un momento.';
  }
  if (code === 'unknown_foreground') {
    return 'No se detectó ninguna prenda en la imagen.';
  }

  return title || 'No se pudo quitar el fondo de la imagen.';
};

// ------------------------------------------------------------
// Tamaño de la imagen (para decidir si hay que achicarla)
// ------------------------------------------------------------
const getImageWidth = (uri) =>
  new Promise((resolve) => {
    Image.getSize(
      uri,
      (width) => resolve(width),
      () => resolve(null)
    );
  });

// ------------------------------------------------------------
// CELULAR: lee la imagen en base64 con expo-image-manipulator.
// Esto resuelve URIs file://, content:// (Android) y ph:// (iOS),
// que el FormData nativo no siempre sabe leer.
// ------------------------------------------------------------
const getBase64OnMobile = async (uri) => {
  const width = await getImageWidth(uri);

  const actions =
    width && width > MAX_MOBILE_WIDTH
      ? [{ resize: { width: MAX_MOBILE_WIDTH } }]
      : [];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!result?.base64) {
    throw new Error('No se pudo leer la imagen seleccionada.');
  }

  return result.base64;
};

// ------------------------------------------------------------
// CELULAR: envía JSON y recibe JSON (sin blobs ni FileReader,
// que son poco confiables en React Native).
// ------------------------------------------------------------
const removeBackgroundOnMobile = async (imageUri) => {
  const base64 = await getBase64OnMobile(imageUri);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(REMOVE_BG_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: base64,
        size: 'auto',
        // Fondo BLANCO real (antes devolvía PNG transparente) y JPG, que pesa
        // mucho menos. Evita además que el selector de color lea
        // píxeles transparentes como "Negro".
        bg_color: 'ffffff',
        format: 'jpg',
      }),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      console.log('Error Remove.bg (móvil):', response.status, json);
      throw new Error(getFriendlyError(response.status, json));
    }

    const resultB64 = json?.data?.result_b64;

    if (!resultB64) {
      console.log('Remove.bg sin imagen en la respuesta:', json);
      throw new Error('Remove.bg no devolvió ninguna imagen.');
    }

    return `data:image/jpeg;base64,${resultB64}`;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Probá de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ------------------------------------------------------------
// WEB (PC): se mantiene el método que ya funcionaba.
// ------------------------------------------------------------
const removeBackgroundOnWeb = async (imageUri) => {
  const formData = new FormData();
  formData.append('size', 'auto');
  formData.append('bg_color', 'ffffff');
  formData.append('format', 'jpg');

  const imgResponse = await fetch(imageUri);
  const imgBlob = await imgResponse.blob();
  formData.append('image_file', imgBlob, 'clothing.jpg');

  const response = await fetch(REMOVE_BG_URL, {
    method: 'POST',
    headers: {
      'X-Api-Key': REMOVE_BG_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.log('Error Remove.bg (web):', response.status, errorData);
    throw new Error(getFriendlyError(response.status, errorData));
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // 'data:image/jpeg;base64,...'
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ------------------------------------------------------------
// FUNCIÓN PRINCIPAL (misma firma de siempre)
// @param {string} imageUri - URI de la imagen seleccionada
// @returns {Promise<string>} data URI de la imagen sin fondo
// ------------------------------------------------------------
export const removeBackground = async (imageUri) => {
  if (!imageUri) {
    throw new Error('No se ha proporcionado ninguna imagen.');
  }

  if (!REMOVE_BG_API_KEY) {
    throw new Error(
      'Falta configurar EXPO_PUBLIC_REMOVE_BG_API_KEY en el archivo .env.'
    );
  }

  try {
    if (Platform.OS === 'web') {
      return await removeBackgroundOnWeb(imageUri);
    }

    return await removeBackgroundOnMobile(imageUri);
  } catch (error) {
    console.log('Error en removeBackground:', error);
    throw error;
  }
};