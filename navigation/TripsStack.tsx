import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TripsStackParamList } from './types';
import TripDashboard from '../screens/TripDashboard';
import TripDetailScreen from '../screens/TripDetailScreen';
import TripBriefScreen from '../screens/TripBriefScreen';
import PassengerGroupDetailScreen from '../screens/PassengerGroupDetailScreen';
import ShareTripScreen from '../screens/ShareTripScreen';
import AddPassengerGroupScreen from '../screens/AddPassengerGroupScreen';
import AddMemberSelectionScreen from '../screens/AddMemberSelectionScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import TripInvitationScreen from '../screens/TripInvitationScreen';

const Stack = createNativeStackNavigator<TripsStackParamList>();

export default function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="TripDashboard" component={TripDashboard} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="TripBrief" component={TripBriefScreen} />
      <Stack.Screen name="TripInvitation" component={TripInvitationScreen} />
      <Stack.Screen name="AddPassengerGroup" component={AddPassengerGroupScreen} />
      <Stack.Screen name="DriverProfile" component={PlaceholderScreen} initialParams={{ title: 'Driver' }} />
      <Stack.Screen name="PassengerGroupDetail" component={PassengerGroupDetailScreen} />
      <Stack.Screen name="PassengerGroupBrief" component={PlaceholderScreen} initialParams={{ title: 'Group Brief' }} />
      <Stack.Screen name="ShareTrip" component={ShareTripScreen} />
      <Stack.Screen name="AddMemberSelection" component={AddMemberSelectionScreen} />
    </Stack.Navigator>
  );
}
