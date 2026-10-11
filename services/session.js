import { Alert, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { setAuthToken } from './api';

export const logout = (navigation) => {
  setAuthToken(null);

  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'Welcome' }, { name: 'Login' }],
    })
  );
};

export const confirmLogout = (navigation) => {
  if (Platform.OS === 'web') {
    if (window.confirm('¿Querés cerrar sesión?')) {
      logout(navigation);
    }
    return;
  }

  Alert.alert('Cerrar sesión', '¿Querés cerrar sesión?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Cerrar sesión',
      style: 'destructive',
      onPress: () => logout(navigation),
    },
  ]);
};
