import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AddStackParamList } from './types';
import CreateTripScreen from '../screens/CreateTripScreen';

const Stack = createNativeStackNavigator<AddStackParamList>();

export default function AddStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
    </Stack.Navigator>
  );
}
