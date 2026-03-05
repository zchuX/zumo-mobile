import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from './types';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export default function FriendsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="FriendsList" component={PlaceholderScreen} initialParams={{ title: 'Friends' }} />
      <Stack.Screen name="FriendInvites" component={PlaceholderScreen} initialParams={{ title: 'Invites' }} />
      <Stack.Screen name="PeopleSearch" component={PlaceholderScreen} initialParams={{ title: 'Search' }} />
      <Stack.Screen name="PeopleSearchResults" component={PlaceholderScreen} initialParams={{ title: 'Results' }} />
      <Stack.Screen name="MemberProfile" component={PlaceholderScreen} initialParams={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
