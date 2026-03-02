import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setTokenStorage, setApiConfig } from './src';
import { AppProvider } from './src/AppContext';
import { AppStateProvider, useApp } from './context/AppState';
import Loading from './src/components/Loading';
import Icon from './src/components/Icon';
import LoginScreen from './screens/LoginScreen';
import AccountScreen from './screens/AccountScreen';
import SupportScreen from './screens/SupportScreen';
import SettingsScreen from './screens/SettingsScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import TripDashboard from './screens/TripDashboard';
import * as authService from './src/api/authService';
import type { User } from './src/types';
import { colors, fontSize } from './src/theme';

const queryClient = new QueryClient();

function AppWithUser() {
  const { user } = useApp();
  return (
    <AppProvider value={{ user }}>
      <AppContent />
    </AppProvider>
  );
}

const TOKEN_STORAGE = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

function AppContent() {
  const {
    user,
    setUser,
    currentScreen,
    setCurrentScreen,
    t,
    setDashboardShowHistory,
    setSelectedTripId,
    setBriefTrip,
    setInvitationDetails,
  } = useApp();
  const [isRestoring, setIsRestoring] = useState(true);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 448);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await TOKEN_STORAGE.getItem('idToken');
        if (token && !user && mounted) {
          const raw = await authService.getProfile();
          const profile = (raw as Record<string, unknown>)?.user ?? (raw as Record<string, unknown>)?.data ?? raw;
          const p = profile as Record<string, unknown>;
          const userArn =
            (p?.userArn ?? p?.id ?? p?.sub ?? p?.userId ?? p?.username ?? p?.arn ?? '') as string;
          const u: User = {
            userArn,
            id: userArn,
            name: (p?.name ?? p?.username ?? p?.displayName ?? 'User') as string,
            email: p?.email as string | undefined,
            phone_number: p?.phone_number as string | undefined,
            avatar: (p?.imageUrl ?? p?.photoUrl ?? p?.avatarUrl ?? p?.picture ?? 'https://picsum.photos/seed/default/200') as string,
          };
          setUser(u);
          if (currentScreen === 'login') setCurrentScreen('trips');
        }
      } catch (e) {
        console.error('Restore session failed', e);
        await AsyncStorage.multiRemove(['idToken', 'accessToken', 'refreshToken']);
      }
      if (mounted) setIsRestoring(false);
    })();
    return () => { mounted = false; };
  }, []);

  const hideBottomNav = [
    'login',
    'register',
    'reset_password',
    'create_trip',
    'trip_detail',
    'friend_invites',
    'support',
    'settings',
    'add_passenger_group',
    'driver_profile',
    'passenger_group_detail',
    'passenger_group_brief',
    'share_trip',
    'add_member_selection',
    'member_profile',
    'trip_search',
    'trip_brief',
    'trip_invitation',
    'people_search',
    'people_search_results',
    'add_vehicle',
    'manage_vehicle',
    'manage_account',
    'modify_password',
  ].includes(currentScreen);

  const renderScreen = () => {
    if (isRestoring) {
      return (
        <View style={styles.restoring}>
          <Loading message={t.loading ?? 'Restoring Session...'} />
        </View>
      );
    }
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={(profile) => { setUser(profile); setCurrentScreen('trips'); }} />;
      case 'register':
        return <PlaceholderScreen title={t.register} onBack={() => setCurrentScreen('login')} />;
      case 'reset_password':
        return <PlaceholderScreen title={t.resetPassword} onBack={() => setCurrentScreen('login')} />;
      case 'trips':
        return (
          <TripDashboard
            onSelectTrip={(id) => {
              setSelectedTripId(id);
              setCurrentScreen('trip_detail');
            }}
            onSelectInvitation={(trip, type, inviter, group) => {
              setBriefTrip(trip);
              setInvitationDetails({ type, inviterName: inviter, groupName: group });
              setCurrentScreen('trip_invitation');
            }}
            onSearch={() => setCurrentScreen('trip_search')}
          />
        );
      case 'account':
        return <AccountScreen onNavigate={setCurrentScreen} />;
      case 'support':
        return <SupportScreen onBack={() => setCurrentScreen('account')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('account')} />;
      case 'friends':
      case 'garage':
      case 'create_trip':
      case 'trip_detail':
      case 'trip_search':
      case 'trip_brief':
      case 'trip_invitation':
      case 'add_passenger_group':
      case 'driver_profile':
      case 'passenger_group_detail':
      case 'passenger_group_brief':
      case 'share_trip':
      case 'add_member_selection':
      case 'member_profile':
      case 'people_search':
      case 'people_search_results':
      case 'friend_invites':
      case 'manage_account':
      case 'modify_password':
      case 'add_vehicle':
      case 'manage_vehicle':
        return (
          <PlaceholderScreen
            title={currentScreen.replace(/_/g, ' ')}
            onBack={() => setCurrentScreen('trips')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={[styles.phone, { maxWidth }]}>
        <View style={styles.screenArea}>{renderScreen()}</View>
        {user && !hideBottomNav && (
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable
              onPress={() => { setDashboardShowHistory(false); setCurrentScreen('trips'); }}
              style={styles.navItem}
            >
              <Icon
                name="calendar_today"
                size={24}
                color={currentScreen === 'trips' ? colors.sage : colors.slate[400]}
              />
              <Text style={[styles.navLabel, currentScreen === 'trips' && styles.navLabelActive]}>{t.trips}</Text>
            </Pressable>
            <Pressable onPress={() => setCurrentScreen('friends')} style={styles.navItem}>
              <Icon name="group" size={24} color={currentScreen === 'friends' ? colors.sage : colors.slate[400]} />
              <Text style={[styles.navLabel, currentScreen === 'friends' && styles.navLabelActive]}>{t.friends}</Text>
            </Pressable>
            <Pressable onPress={() => setCurrentScreen('create_trip')} style={styles.navAdd}>
              <View style={styles.navAddInner}>
                <Icon name="add" size={24} color={colors.white} />
              </View>
              <Text style={styles.navAddText}>{t.startTrip}</Text>
            </Pressable>
            <Pressable onPress={() => setCurrentScreen('garage')} style={styles.navItem}>
              <Icon name="garage" size={24} color={currentScreen === 'garage' ? colors.sage : colors.slate[400]} />
              <Text style={[styles.navLabel, currentScreen === 'garage' && styles.navLabelActive]}>{t.garage}</Text>
            </Pressable>
            <Pressable onPress={() => setCurrentScreen('account')} style={styles.navItem}>
              <Icon name="person" size={24} color={currentScreen === 'account' ? colors.sage : colors.slate[400]} />
              <Text style={[styles.navLabel, currentScreen === 'account' && styles.navLabelActive]}>{t.account}</Text>
            </Pressable>
          </View>
        )}
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    setTokenStorage(TOKEN_STORAGE);
    setApiConfig({
      BASE_URL: 'https://ltr38e7hx8.execute-api.us-east-1.amazonaws.com/dev',
      HEADERS: {
        'Content-Type': 'application/json',
        'x-api-key': '3CDSGzm1IH3q7ixup3hJ84B534K9Fe7Y5NrDoCmr',
      },
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppStateProvider>
          <AppWithUser />
        </AppStateProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.iosGray,
    alignItems: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  screenArea: { flex: 1, overflow: 'hidden' },
  restoring: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: { fontSize: 9, fontWeight: '700', color: colors.slate[400] },
  navLabelActive: { color: colors.sage },
  navAdd: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  navAddInner: {
    width: 48,
    height: 40,
    backgroundColor: colors.sage,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navAddText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
