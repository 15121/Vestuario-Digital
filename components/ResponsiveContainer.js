import React from 'react';
import { View, StyleSheet, Platform, SafeAreaView } from 'react-native';

export default function ResponsiveContainer({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F5FF',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});