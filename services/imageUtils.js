// services/imageUtils.js
//
// toPersistentUri(uri) se llama justo antes de guardar una prenda.
// Misma firma de siempre, pero ahora además:
//
//  1. Redimensiona fotos grandes (ancho máximo 1024 px, JPEG 0.8).
//     Evita listas de varios MB y problemas con max_allowed_packet
//     del MySQL de XAMPP.
//  2. WEB: devuelve un data URI (las URIs blob: se pierden al recargar).
//  3. CELULAR: copia la imagen a la carpeta de documentos de la app.
//     La URI de caché de expo-image-picker puede ser borrada por el sistema.
//
// Si algo falla, se devuelve la imagen original (nunca se bloquea el guardado).

import { Platform, Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export const MAX_IMAGE_WIDTH = 1024;
export const IMAGE_QUALITY = 0.8;

// ------------------------------------------------------------
// expo-file-system (solo celular).
// En SDK 54+ la API clásica vive en 'expo-file-system/legacy';
// en versiones anteriores, en 'expo-file-system'.
// Si no está instalado, se omite la copia persistente.
// ------------------------------------------------------------
const getFileSystem = () => {
  try {
    // eslint-disable-next-line global-require
    return require('expo-file-system/legacy');
  } catch (legacyError) {
    try {
      // eslint-disable-next-line global-require
      return require('expo-file-system');
    } catch (error) {
      return null;
    }
  }
};

const getImageWidth = (uri) =>
  new Promise((resolve) => {
    Image.getSize(
      uri,
      (width) => resolve(width),
      () => resolve(null)
    );
  });

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// ------------------------------------------------------------
// Redimensiona solo si hace falta (nunca agranda)
// ------------------------------------------------------------
const shrinkIfNeeded = async (uri) => {
  try {
    const width = await getImageWidth(uri);

    if (!width || width <= MAX_IMAGE_WIDTH) {
      return uri;
    }

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_WIDTH } }],
      {
        compress: IMAGE_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result?.uri || uri;
  } catch (error) {
    console.log('No se pudo redimensionar la imagen:', error);
    return uri;
  }
};

// ------------------------------------------------------------
// WEB
// ------------------------------------------------------------
const prepareOnWeb = async (uri) => {
  const resized = await shrinkIfNeeded(uri);

  if (resized.startsWith('data:')) {
    return resized;
  }

  const blob = await (await fetch(resized)).blob();
  return blobToDataUrl(blob);
};

// ------------------------------------------------------------
// CELULAR
// ------------------------------------------------------------
const prepareOnMobile = async (uri) => {
  const FileSystem = getFileSystem();

  if (!FileSystem?.documentDirectory) {
    return uri;
  }

  // Ya está guardada en la carpeta de la app (ej. al editar sin cambiar la foto)
  if (uri.startsWith(FileSystem.documentDirectory)) {
    return uri;
  }

  const folder = `${FileSystem.documentDirectory}clothes/`;

  try {
    await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  } catch (error) {
    // la carpeta ya existe
  }

  const fileName = `${Date.now()}-${Math.floor(Math.random() * 100000)}.jpg`;
  const destination = `${folder}${fileName}`;

  // Imagen en data URI (ej. resultado de quitar el fondo): se escribe a archivo
  if (uri.startsWith('data:')) {
    const base64 = uri.split(',')[1] || '';

    await FileSystem.writeAsStringAsync(destination, base64, {
      encoding: 'base64',
    });

    const resizedFromData = await shrinkIfNeeded(destination);

    if (resizedFromData === destination) {
      return destination;
    }

    // Se redimensionó: se copia el resultado y se borra el archivo temporal
    const finalDestination = `${folder}r-${fileName}`;
    await FileSystem.copyAsync({ from: resizedFromData, to: finalDestination });
    await FileSystem.deleteAsync(destination, { idempotent: true });
    return finalDestination;
  }

  const resized = await shrinkIfNeeded(uri);

  await FileSystem.copyAsync({ from: resized, to: destination });

  return destination;
};

// ------------------------------------------------------------
// FUNCIÓN PRINCIPAL (misma firma de siempre)
// ------------------------------------------------------------
export const toPersistentUri = async (uri) => {
  if (!uri) {
    return uri;
  }

  try {
    return Platform.OS === 'web'
      ? await prepareOnWeb(uri)
      : await prepareOnMobile(uri);
  } catch (error) {
    console.log('toPersistentUri falló, se usa la imagen original:', error);
    return uri;
  }
};
