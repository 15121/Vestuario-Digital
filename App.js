import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { 
  useFonts, 
  Poppins_400Regular, 
  Poppins_600SemiBold, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

import VisualizarArmarioScreen from './screens/clothingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F5FF' }}>
        <ActivityIndicator size="large" color="#A674DF" />
      </View>
    );
  }

  return <VisualizarArmarioScreen />;
}