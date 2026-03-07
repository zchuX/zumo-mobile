import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from './types';
import FriendsListScreen from '../screens/FriendsListScreen';
import PeopleSearchScreen from '../screens/PeopleSearchScreen';
import PeopleSearchResultsScreen from '../screens/PeopleSearchResultsScreen';
import MemberProfileScreen from '../screens/MemberProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export default function FriendsStack() {
  return (
    <Stack.Navigator
      initialRouteName="FriendsList"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
    >
      <Stack.Screen name="FriendsList" component={FriendsListScreen} />
      <Stack.Screen name="FriendInvites" component={PlaceholderScreen} initialParams={{ title: 'Invites' }} />
      <Stack.Screen name="PeopleSearch" component={PeopleSearchScreen} />
      <Stack.Screen name="PeopleSearchResults" component={PeopleSearchResultsScreen} />
      <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
    </Stack.Navigator>
  );
}
