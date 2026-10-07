import AsyncStorage from '@react-native-async-storage/async-storage';


// ============================================================
// IDENTIFICADOR DEL USUARIO
// ============================================================

const getUserId = (user) => {
  return (
    user?.id ??
    user?.id_usuario ??
    'guest'
  );
};


// ============================================================
// CLAVE DE STORAGE
// ============================================================

const getCityKey = (user) => {
  const userId =
    getUserId(user);

  return `weatherCity_${userId}`;
};


// ============================================================
// GUARDAR CIUDAD
// ============================================================

export const saveUserCity = async (
  user,
  city
) => {
  try {
    const cleanCity =
      String(city || '').trim();

    if (!cleanCity) {
      return false;
    }

    const key =
      getCityKey(user);

    await AsyncStorage.setItem(
      key,
      cleanCity
    );

    return true;
  } catch (error) {
    console.error(
      'Error al guardar la ciudad:',
      error
    );

    return false;
  }
};


// ============================================================
// OBTENER CIUDAD
// ============================================================

export const getUserCity = async (
  user
) => {
  try {
    const key =
      getCityKey(user);

    const savedCity =
      await AsyncStorage.getItem(
        key
      );

    if (
      savedCity === null ||
      savedCity === undefined
    ) {
      return null;
    }

    const cleanCity =
      String(savedCity).trim();

    return cleanCity || null;
  } catch (error) {
    console.error(
      'Error al obtener la ciudad:',
      error
    );

    return null;
  }
};


// ============================================================
// ELIMINAR CIUDAD
// ============================================================

export const removeUserCity = async (
  user
) => {
  try {
    const key =
      getCityKey(user);

    await AsyncStorage.removeItem(
      key
    );

    return true;
  } catch (error) {
    console.error(
      'Error al eliminar la ciudad:',
      error
    );

    return false;
  }
};