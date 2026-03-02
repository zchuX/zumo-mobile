# Connect API — Reuse from Web, No window/localStorage

The mobile app reuses the same API code as the web project. All calls go through `src/api` (and `src/hooks/useTrips` for trips). There is **no** `window` or `localStorage` in the shared code.

## Where it lives

- **`src/api/`** — `apiClient`, `authService`, `tripService`, `mockTrips`
- **`src/api/index.ts`** — single entry: `import { getProfile, listTrips, ... } from '../src/api'`
- **`src/hooks/useTrips.ts`** — React Query hooks that call tripService

## How it’s wired (App.tsx)

1. **Token storage** — `setTokenStorage(AsyncStorageAdapter)` so auth uses AsyncStorage instead of `localStorage`.
2. **API config** — `setApiConfig({ BASE_URL, HEADERS })` so the same code works without `import.meta.env`.

After that, any screen can call the API the same way as on web.

## Example (same as web)

```ts
import { getProfile, listTrips } from '../src/api';

useEffect(() => {
  getProfile().then(setData);
}, []);

// or with trips
listTrips({ completed: false }).then((res) => setData(res.trips));
```

## Replacements vs web

| Web | Mobile |
|-----|--------|
| `localStorage.getItem('idToken')` | `tokenStorage.getTokenAsync('idToken')` (backed by AsyncStorage) |
| `localStorage.setItem/removeItem` | `tokenStorage.setTokensAsync` / `clearTokensAsync` |
| `import.meta.env.VITE_API_BASE_URL` | `getApiConfig().BASE_URL` (set via `setApiConfig()` at startup) |

Screens already using the API: **LoginScreen** (login, getProfile), **AccountScreen** (logout, tokenStorage), **TripDashboard** (useUncompletedTrips, useCompletedTrips, useLeaveTrip), **RootNavigator** (getProfile for session restore).
