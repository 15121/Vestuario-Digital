// ============================================================
// SERVICIO DE ELIMINACIÓN DE FONDO (remove.bg)
// ============================================================
import { Platform } from 'react-native';

const REMOVE_BG_API_KEY = 'd8wnzx1YaantrQ17t4RVTQie'; // Pegá tu API Key acá

/**
 * Elimina el fondo de una imagen mediante la API de remove.bg
 * Funciona tanto en Celular (iOS/Android) como en Web (PC).
 * @param {string} imageUri - URI local de la imagen seleccionada
 * @returns {Promise<string>} URI en base64 de la imagen sin fondo (transparente)
 */
export const removeBackground = async (imageUri) => {
  if (!imageUri) {
    throw new Error('No se ha proporcionado ninguna imagen.');
  }

  try {
    // 1. Armamos el formulario Multipart con la imagen
    const formData = new FormData();
    formData.append('size', 'auto');

    if (Platform.OS === 'web') {
      // En la Web, FormData necesita un Blob/File real. El objeto
      // { uri, type, name } es un truco propio de React Native nativo
      // que el navegador no entiende (termina mandando "[object Object]"
      // en vez del archivo). Por eso convertimos la imageUri (blob:...
      // o data:...) a un Blob real antes de adjuntarla.
      const imgResponse = await fetch(imageUri);
      const imgBlob = await imgResponse.blob();
      formData.append('image_file', imgBlob, 'clothing.jpg');
    } else {
      // En Celular (iOS/Android) sí funciona este formato de objeto.
      formData.append('image_file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'clothing.jpg',
      });
    }

    // 2. Realizamos la petición a la API
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error Remove.bg:', errorData);
      throw new Error('No se pudo quitar el fondo de la imagen.');
    }

    // 3. Convertimos la respuesta (blob) a Base64 para guardarla o mostrarla directo
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // Devuelve 'data:image/png;base64,...'
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.log('Error en removeBackground:', error);
    throw error;
  }
};
