import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GarageStackParamList } from './types';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useApp } from '../context/AppState';

const Stack = createNativeStackNavigator<GarageStackParamList>();

export default function GarageStack() {
  const { t } = useApp();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="GarageList" component={PlaceholderScreen} initialParams={{ title: t.garage }} />
      <Stack.Screen name="VehicleForm" component={PlaceholderScreen} initialParams={{ title: 'Vehicle' }} />
    </Stack.Navigator>
  );
}
