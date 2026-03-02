# Shared source (from web app)

This folder contains API layer, types, constants, trip mappers, and React hooks moved from the web app and adapted for React Native (no DOM, no `localStorage`).

## Setup (required before using API or hooks)

In your app entry (e.g. `App.tsx` or a bootstrap file), before rendering or calling any API:

```ts
import { setTokenStorage, setApiConfig } from './src';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage (required for auth)
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
setTokenStorage(asyncStorageAdapter);

// API config (optional; defaults work for dev)
setApiConfig({
  BASE_URL: 'https://your-api.example.com',
  HEADERS: { 'Content-Type': 'application/json', 'x-api-key': 'your-key' },
});
```

Wrap your app with `AppProvider` so `useApp()` and trip hooks have access to the current user:

```tsx
import { AppProvider } from './src';

<AppProvider value={{ user: currentUser }}>
  <QueryClientProvider client={queryClient}>
    {/* ... */}
  </QueryClientProvider>
</AppProvider>
```

## Structure

- **api/** — apiClient, authService, tripService, mockTrips
- **config.ts** — API base URL and headers (set via `setApiConfig`)
- **storage.ts** — token storage abstraction (set via `setTokenStorage`)
- **types.ts** — shared TypeScript types
- **constants.ts** — COUNTRY_CODES, TRANSLATIONS, API_CONFIG getter
- **data/trips/keys.ts** — React Query key factory
- **utils/tripMappers.ts** — map backend trip types to frontend Trip
- **AppContext.tsx** — minimal context for `user` (useApp)
- **hooks/useTrips.ts** — React Query hooks for trips (useTrip, useCreateTrip, etc.)
