import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// floating = false → se comporta como siempre (Login, Registro, etc.)
// floating = true  → se superpone flotando arriba, sin mover el contenido
export default function AlertMessage({
  type = 'success',
  message,
  floating = false,
  top = 12,
}) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  const containerStyle = isSuccess
    ? styles.successBg
    : isWarning
    ? styles.warningBg
    : styles.errorBg;

  const iconBgStyle = isSuccess
    ? styles.successIconBg
    : isWarning
    ? styles.warningIconBg
    : styles.errorIconBg;

  const iconName = isSuccess
    ? 'checkmark'
    : isWarning
    ? 'alert-circle-outline'
    : 'warning-outline';

  const iconColor = isSuccess
    ? '#2E7D32'
    : isWarning
    ? '#B26A00'
    : '#D32F2F';

  const content = (
    <View
      style={[
        styles.container,
        containerStyle,
        floating && styles.containerFloating,
      ]}
    >
      <View style={[styles.iconCircle, iconBgStyle]}>
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );

  if (!floating) return content;

  return (
    <View pointerEvents="none" style={[styles.floatingWrapper, { top }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
    width: '100%',
  },
  successBg: { backgroundColor: '#E8F5E9' },
  errorBg: { backgroundColor: '#FFEBEE' },
  warningBg: { backgroundColor: '#FFF3E0' },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successIconBg: { backgroundColor: '#C8E6C9' },
  errorIconBg: { backgroundColor: '#FFCDD2' },
  warningIconBg: { backgroundColor: '#FFE0B2' },
  text: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },

  // --- Modo flotante ---
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  containerFloating: {
    marginBottom: 0,
    maxWidth: 520,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
});