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

## Connect API — same as web (no window/localStorage)

API code is reused from the web project. Token storage and API base URL are set at app startup (see Setup above). Use the same fetch-style pattern in any screen:

```ts
import { getProfile, listTrips } from '../src/api';

// In a component:
const [data, setData] = useState(null);

useEffect(() => {
  getProfile().then(setData);
}, []);

// Or with the trip service:
useEffect(() => {
  listTrips({ completed: false }).then((res) => setData(res.trips));
}, []);
```

- **Auth:** `login`, `register`, `getProfile`, `logout`, `verifyCode`, `sendResetCode`, `confirmReset`, `refreshToken` from `../src/api` or `../src/api/authService`.
- **Trips:** `listTrips`, `getTripDetails`, `createTrip`, etc. from `../src/api` or `../src/api/tripService`, or use the hooks: `useUncompletedTrips()`, `useTrip(tripArn)`, `useCreateTrip()` from `../src/hooks/useTrips`.
- **Low-level:** `api.get()`, `api.post()`, `api.put()`, `api.delete()` from `../src/api` for custom endpoints.

Any `localStorage` or `window` usage from the web app has been replaced: tokens go through `tokenStorage` (backed by AsyncStorage in the app), and config through `setApiConfig()`.

## Structure

- **api/** — apiClient, authService, tripService, mockTrips (see api/index.ts)
- **config.ts** — API base URL and headers (set via `setApiConfig`)
- **storage.ts** — token storage abstraction (set via `setTokenStorage`)
- **types.ts** — shared TypeScript types
- **constants.ts** — COUNTRY_CODES, TRANSLATIONS, API_CONFIG getter
- **data/trips/keys.ts** — React Query key factory
- **utils/tripMappers.ts** — map backend trip types to frontend Trip
- **AppContext.tsx** — minimal context for `user` (useApp)
- **hooks/useTrips.ts** — React Query hooks for trips (useTrip, useCreateTrip, etc.)
