import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../src/api/authService';
import { tokenStorage } from '../src/storage';
import type { User } from '../src/types';
import { useApp } from '../context/AppState';
import Loading from '../src/components/Loading';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { colors } from '../src/theme';

export default function RootNavigator() {
  const { user, setUser } = useApp();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await tokenStorage.getTokenAsync('idToken');
        if (token && !user && mounted) {
          const raw = await authService.getProfile();
          const profile =
            (raw as Record<string, unknown>)?.user ??
            (raw as Record<string, unknown>)?.data ??
            raw;
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
        }
      } catch (e) {
        console.error('Restore session failed', e);
        await AsyncStorage.multiRemove(['idToken', 'accessToken', 'refreshToken']);
      }
      if (mounted) setIsRestoring(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <Loading message="Restoring session..." />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.sage,
          background: colors.white,
          card: colors.white,
          text: colors.slate[900],
          border: colors.slate[200],
          notification: colors.sage,
        },
      }}
    >
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});
