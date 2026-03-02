import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TripsStackParamList } from './types';
import TripDashboard from '../screens/TripDashboard';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<TripsStackParamList>();

export default function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="TripDashboard" component={TripDashboard} />
      <Stack.Screen name="TripDetail" component={PlaceholderScreen} initialParams={{ title: 'Trip Detail' }} />
      <Stack.Screen name="TripSearch" component={PlaceholderScreen} initialParams={{ title: 'Search Trip' }} />
      <Stack.Screen name="TripBrief" component={PlaceholderScreen} initialParams={{ title: 'Trip Brief' }} />
      <Stack.Screen name="TripInvitation" component={PlaceholderScreen} initialParams={{ title: 'Invitation' }} />
      <Stack.Screen name="AddPassengerGroup" component={PlaceholderScreen} initialParams={{ title: 'Add Group' }} />
      <Stack.Screen name="DriverProfile" component={PlaceholderScreen} initialParams={{ title: 'Driver' }} />
      <Stack.Screen name="PassengerGroupDetail" component={PlaceholderScreen} initialParams={{ title: 'Group Detail' }} />
      <Stack.Screen name="PassengerGroupBrief" component={PlaceholderScreen} initialParams={{ title: 'Group Brief' }} />
      <Stack.Screen name="ShareTrip" component={PlaceholderScreen} initialParams={{ title: 'Share Trip' }} />
      <Stack.Screen name="AddMemberSelection" component={PlaceholderScreen} initialParams={{ title: 'Add Member' }} />
    </Stack.Navigator>
  );
}
