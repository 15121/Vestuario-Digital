import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

import { initDatabase } from './services/database';
import WelcomeScreen from './screens/welcomeScreen';
import LoginScreen from './screens/loginScreen';
import RegisterScreen from './screens/registerScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';  

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    initDatabase();
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
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}