import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setTokenStorage, setApiConfig } from './src';
import { AppProvider } from './src/AppContext';
import { AppStateProvider } from './context/AppState';
import RootNavigator from './navigation/RootNavigator';
import { useApp } from './context/AppState';

const queryClient = new QueryClient();

const TOKEN_STORAGE = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

function AppWithUser() {
  const { user } = useApp();
  return (
    <AppProvider value={{ user }}>
      <RootNavigator />
    </AppProvider>
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
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
