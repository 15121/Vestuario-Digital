import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colours';

let enqueueDialog = null;

// Mismo formato que Alert.alert(title, message, buttons)
export const appAlert = (title, message, buttons) => {
  const dialog = {
    title: title || '',
    message: message || '',
    buttons:
      Array.isArray(buttons) && buttons.length > 0
        ? buttons
        : [{ text: 'Aceptar' }],
  };

  if (enqueueDialog) {
    enqueueDialog(dialog);
  }
};

// Elige ícono y color según el contenido
const getKind = (dialog) => {
  const text = `${dialog.title} ${dialog.message}`.toLowerCase();
  const hasDestructive = dialog.buttons.some((b) => b.style === 'destructive');

  if (hasDestructive) {
    return { icon: 'alert-circle-outline', color: '#C94C6D', bg: '#FDECEF' };
  }

  if (
    text.includes('error') ||
    text.includes('no se pudo') ||
    text.includes('no fue posible') ||
    text.includes('denegado') ||
    text.includes('incorrect')
  ) {
    return { icon: 'close-circle-outline', color: '#C94C6D', bg: '#FDECEF' };
  }

  if (
    text.includes('éxito') ||
    text.includes('correctamente') ||
    text.includes('exitosamente') ||
    text.includes('guardados')
  ) {
    return { icon: 'checkmark-circle-outline', color: '#4E9B70', bg: '#E8F5E9' };
  }

  if (
    text.includes('obligatorio') ||
    text.includes('requerid') ||
    text.includes('atención') ||
    text.includes('seleccioná') ||
    text.includes('ingresá')
  ) {
    return { icon: 'alert-circle-outline', color: '#B26A00', bg: '#FFF3E0' };
  }

  return {
    icon: 'information-circle-outline',
    color: COLORS.buttonDark,
    bg: '#F3E8FF',
  };
};

export function AppDialogHost() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    enqueueDialog = (dialog) => setQueue((previous) => [...previous, dialog]);

    return () => {
      enqueueDialog = null;
    };
  }, []);

  const current = queue[0];

  if (!current) {
    return null;
  }

  const kind = getKind(current);
  const hasCancel = current.buttons.find((b) => b.style === 'cancel');

  const closeWith = (button) => {
    setQueue((previous) => previous.slice(1));

    if (button?.onPress) {
      button.onPress();
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => closeWith(hasCancel)}>
      <Pressable style={styles.overlay} onPress={() => hasCancel && closeWith(hasCancel)}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconCircle, { backgroundColor: kind.bg }]}>
            <Ionicons name={kind.icon} size={34} color={kind.color} />
          </View>

          {!!current.title && <Text style={styles.title}>{current.title}</Text>}
          {!!current.message && <Text style={styles.message}>{current.message}</Text>}

          <View
            style={[
              styles.buttons,
              current.buttons.length > 2 && styles.buttonsColumn,
            ]}
          >
            {current.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';

              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  activeOpacity={0.85}
                  onPress={() => closeWith(button)}
                  style={[
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel && !isDestructive && styles.buttonPrimary,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text || 'Aceptar'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(55, 35, 75, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonPrimary: {
    backgroundColor: COLORS.buttonDark,
  },
  buttonDestructive: {
    backgroundColor: '#C94C6D',
  },
  buttonCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.buttonDark,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: COLORS.buttonDark,
  },
});
