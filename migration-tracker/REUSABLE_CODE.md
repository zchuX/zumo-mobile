# Reusable Code from Web App → Native

This document identifies what was moved from the web app and what was adapted for React Native (no `window`, `document`, or `localStorage`).

**Location of moved code:** All shared code lives under **`src/`**. Entry point: **`src/index.ts`**.

---

## ✅ Moved as-is (no DOM/browser dependencies)

| Location (web) | Purpose |
|----------------|--------|
| **types.ts** | TypeScript types & interfaces: `User`, `Vehicle`, `Trip`, `Participant`, `TripStatus`, `AppState`, `Language`, etc. Imports `Location` from trip service. |
| **data/trips/keys.ts** | React Query key factory for trips (`tripKeys.list()`, `tripKeys.detail(arn)`). |
| **api/mockTrips.ts** | Mock trip data and types. Pure data + types. |

---

## ✅ Moved with adaptation

### 1. API layer (token storage)

- **api/apiClient.ts**  
  - **Web:** used `localStorage` for `idToken` and to clear tokens on 401.  
  - **Native:** uses a small **token storage abstraction** (`getToken`, `setTokens`, `clearTokens`) so the app can plug in `AsyncStorage` or any key-value store. No `localStorage` in shared code.

- **api/authService.ts**  
  - **Web:** wrote `accessToken`, `idToken`, `refreshToken` to `localStorage` after login/refresh.  
  - **Native:** uses the same token storage abstraction; no `localStorage`.

### 2. Config (env)

- **constants.ts** (or **config**)  
  - **Web:** used `import.meta.env.VITE_*` for `API_CONFIG.BASE_URL` and API key.  
  - **Native:** no `import.meta`. Uses a **config abstraction** (e.g. `setApiConfig()` at app startup) or build-time env (e.g. Expo `extra` / `.env`) so the same constants file can be used with native env.

### 3. Trip service

- **api/tripService.ts**  
  - Depends only on `api` and `mockTrips`.  
  - No DOM. Moves as-is once `api` uses the token abstraction and config is provided.

---

## ✅ Pure logic extracted from hooks

- **utils/tripMappers.ts** (or under **api/**)  
  - `mapUserTripListItemToFrontend()` and `mapBackendTripToFrontend()` from `hooks/useTrips.ts`.  
  - Pure data mapping (no DOM, no React). Reusable in both web and native for transforming API responses into app models.

---

## ✅ Hooks (React only, no DOM)

- **hooks/useTrips.ts**  
  - Uses `@tanstack/react-query` and `useApp()` (React context).  
  - No `window`/`document`/browser APIs. Safe to move to native **if** the native app provides an equivalent `useApp()` (e.g. same shape: `user`, etc.).  
  - Depends on: tripService, tripKeys, types, and the mapping functions (can live in `utils/tripMappers.ts`).

---

## ✅ Constants and static data

- **constants.ts**  
  - `COUNTRY_CODES`, `TRANSLATIONS` (en/zh), `MOCK_USER`, `MOCK_VEHICLES` are pure data.  
  - Only adaptation: `API_CONFIG` must not use `import.meta.env`; use the config abstraction or native env instead.

---

## ❌ Not moved (web-only or DOM-dependent)

| Location | Reason |
|----------|--------|
| **screens/** (all) | UI and navigation; many use `document.*`, DOM events, or web-specific patterns. To be reimplemented with React Native components and navigation. |
| **App.tsx** (web) | Root component, routing, and `AppContext`/`useApp`. Native will have its own root and navigation; can implement a similar context for `useApp()`. |
| **index.tsx**, **index.html**, **vite.config.ts** | Web entry and build. Not used in native. |
| **Loading.tsx** | Component; reimplement in native if needed. |
| **RegisterScreen.tsx**, **LoginScreen.tsx**, **ResetPasswordScreen.tsx** | Use `document.addEventListener`, `document.getElementById` for OTP/inputs. Not moved; reimplement with RN components. |
| **AccountScreen.tsx** | Uses `localStorage` for refresh token; logic can be reused once token storage is abstracted, but the screen itself stays web-only. |

---

## Summary

- **Reusable:** types, trip keys, mock data, API client (with token abstraction), auth service (with token abstraction), trip service, config/constants (with env abstraction), trip mappers, AppContext/useApp, and useTrips hooks (all under `src/`).
- **Adaptations:** token storage and API config are abstracted so the same code runs on web (with `localStorage`/Vite env) and native (with AsyncStorage and native env).

## Setup in the native app

1. **Before any API or auth usage**, call:
   - `setTokenStorage(yourStorage)` — e.g. an adapter over `@react-native-async-storage/async-storage` or SecureStore.
   - `setApiConfig({ BASE_URL, HEADERS })` — e.g. from Expo env or app config.
2. **Wrap the app** with `AppProvider` from `src` and pass `value={{ user: currentUser }}` so `useApp()` and the trip hooks work.
3. **Optional:** Wrap with `QueryClientProvider` from `@tanstack/react-query` if using the `useTrips` hooks.
