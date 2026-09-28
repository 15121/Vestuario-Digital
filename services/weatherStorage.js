
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obtener un identificador único para cada usuario
const getUserId = (user) => {
  return user?.id ?? user?.id_usuario ?? 'guest';
};

// Generar la clave donde se guardará la ciudad
const getCityKey = (user) => {
  const userId = getUserId(user);
  return `weatherCity_${userId}`;
};

// Guardar la ciudad del usuario
export const saveUserCity = async (user, city) => {
  try {
    const cleanCity = city?.trim();

    if (!cleanCity) {
      return false;
    }

    const key = getCityKey(user);

    await AsyncStorage.setItem(key, cleanCity);

    return true;
  } catch (error) {
    console.error('Error al guardar la ciudad:', error);
    return false;
  }
};

// Obtener la ciudad guardada del usuario
export const getUserCity = async (user) => {
  try {
    const key = getCityKey(user);

    const savedCity = await AsyncStorage.getItem(key);

    return savedCity;
  } catch (error) {
    console.error('Error al obtener la ciudad:', error);
    return null;
  }
};

// Eliminar la ciudad guardada del usuario
export const removeUserCity = async (user) => {
  try {
    const key = getCityKey(user);

    await AsyncStorage.removeItem(key);

    return true;
  } catch (error) {
    console.error('Error al eliminar la ciudad:', error);
    return false;
  }
};