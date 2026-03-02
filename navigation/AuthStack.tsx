import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useApp } from '../context/AppState';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const { t } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={PlaceholderScreen} initialParams={{ title: t.register }} />
      <Stack.Screen name="ResetPassword" component={PlaceholderScreen} initialParams={{ title: t.resetPassword }} />
    </Stack.Navigator>
  );
}
