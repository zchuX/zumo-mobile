import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AccountStackParamList } from './types';
import AccountScreen from '../screens/AccountScreen';
import SupportScreen from '../screens/SupportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useApp } from '../context/AppState';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export default function AccountStack() {
  const { t } = useApp();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="ManageAccount" component={PlaceholderScreen} initialParams={{ title: t.account }} />
      <Stack.Screen name="ModifyPassword" component={PlaceholderScreen} initialParams={{ title: t.settings }} />
    </Stack.Navigator>
  );
}
