import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { initDatabase } from './services/database';

// Pantallas iniciales
import WelcomeScreen from './screens/welcomeScreen';
import LoginScreen from './screens/loginScreen';
import RegisterScreen from './screens/registerScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Navegación principal
import MainTabNavigator from './navigation/MainTabNavigator';

// Prendas
import AddClothingScreen from './screens/addClothingScreen';
import ClothingDetailScreen from './screens/clothingDetailScreen';

// Outfits
import MyOutfitsScreen from './screens/myoufitsScreen';
import CreateOutfitScreen from './screens/createOufitScreen';
import OutfitDetailScreen from './screens/outfitDetailScreen';

// Historial
import HistoryClothingScreen from './screens/historyClothingScreen';

// Otras funciones
import WeatherRecScreen from './screens/weatherRecScreen';
import PackingModeScreen from './screens/packingModeScreen';

// Perfil
import ViewProfileScreen from './screens/viewProfileScreen';
import EditProfileScreen from './screens/editProfileScreen';

// Menú hamburguesa
import AboutAppScreen from './screens/aboutAppScreen';
import HelpScreen from './screens/helpScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initDatabase();
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      {Platform.OS === 'web' && (
        <style type="text/css">{`
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            background-color: #F8F5FF;
          }
        `}</style>
      )}

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* INICIO DE LA APP */}
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />

          {/* NAVEGACIÓN PRINCIPAL */}
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
          />

          {/* PRENDAS */}
          <Stack.Screen
            name="AddClothing"
            component={AddClothingScreen}
          />

          <Stack.Screen
            name="ClothingDetail"
            component={ClothingDetailScreen}
          />

          {/* OUTFITS */}
          <Stack.Screen
            name="MyOutfits"
            component={MyOutfitsScreen}
          />

          <Stack.Screen
            name="CrearOutfit"
            component={CreateOutfitScreen}
          />

          <Stack.Screen
            name="OutfitDetail"
            component={OutfitDetailScreen}
          />

          {/* HISTORIAL */}
          <Stack.Screen
            name="HistoryClothing"
            component={HistoryClothingScreen}
          />

          {/* RECOMENDACIÓN CLIMÁTICA */}
          <Stack.Screen
            name="WeatherRec"
            component={WeatherRecScreen}
          />

          {/* MODO MALETA */}
          <Stack.Screen
            name="PackingMode"
            component={PackingModeScreen}
          />

          {/* PERFIL */}
          <Stack.Screen
            name="Profile"
            component={ViewProfileScreen}
          />

          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
          />

          {/* MENÚ HAMBURGUESA */}
          <Stack.Screen
            name="AboutApp"
            component={AboutAppScreen}
          />

          <Stack.Screen
            name="Help"
            component={HelpScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}