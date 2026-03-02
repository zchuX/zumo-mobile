import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AddStackParamList } from './types';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useApp } from '../context/AppState';

const Stack = createNativeStackNavigator<AddStackParamList>();

export default function AddStack() {
  const { t } = useApp();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="CreateTrip" component={PlaceholderScreen} initialParams={{ title: t.createTrip }} />
    </Stack.Navigator>
  );
}
