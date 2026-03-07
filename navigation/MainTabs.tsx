import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from './types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import TripsStack from './TripsStack';
import FriendsStack from './FriendsStack';
import AddStack from './AddStack';
import GarageStack from './GarageStack';
import AccountStack from './AccountStack';
import { colors, fontSize } from '../src/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return <Icon name={name} size={24} color={focused ? colors.sage : colors.slate[400]} />;
}

export default function MainTabs() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom + 8 },
        ],
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.sage,
        tabBarInactiveTintColor: colors.slate[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Trips"
        component={TripsStack}
        options={{
          tabBarLabel: t.trips,
          tabBarIcon: ({ focused }) => <TabBarIcon name="calendar_today" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Friends', { screen: 'FriendsList' });
          },
        })}
        options={{
          tabBarLabel: t.friends,
          tabBarIcon: ({ focused }) => <TabBarIcon name="group" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddStack}
        options={{
          tabBarLabel: t.startTrip,
          tabBarIcon: ({ focused }) => (
            <View style={styles.addButton}>
              <Icon name="add" size={30} color={colors.white} />
            </View>
          ),
          tabBarLabelStyle: [styles.tabLabel, styles.addLabel],
        }}
      />
      <Tab.Screen
        name="Garage"
        component={GarageStack}
        options={{
          tabBarLabel: t.garage,
          tabBarIcon: ({ focused }) => <TabBarIcon name="garage" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={{
          tabBarLabel: t.account,
          tabBarIcon: ({ focused }) => <TabBarIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  tabItem: {
    flex: 1,
  },
  addButton: {
    width: 56,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    marginBottom: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
