import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './screens/welcomeScreen';

import FilterClothesScreen from './screens/filterClothesScreen';

const Stack = createNativeStackNavigator();

export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator

        initialRouteName="Welcome"

        screenOptions={{

          headerShown: false,

        }}

      >

        <Stack.Screen

          name="Welcome"

          component={WelcomeScreen}

        />

        <Stack.Screen

          name="FilterClothes"

          component={FilterClothesScreen}

        />

      </Stack.Navigator>

    </NavigationContainer>

  );

}