# Final migration checklist (web → zumo-mobile)

One-pass verification so behavior and data match the web app where applicable.

---

## ✅ Reusable code (same as web, no DOM)

| Item | Web location | Mobile location | Notes |
|------|--------------|-----------------|--------|
| Types | `types.ts` | `src/types.ts` | User, Vehicle, Trip, Participant, TripStatus, etc. Identical. |
| Trip query keys | `data/trips/keys.ts` | `src/data/trips/keys.ts` | `tripKeys.list()`, `tripKeys.detail(arn)`. |
| Mock trips | `api/mockTrips.ts` | `src/api/mockTrips.ts` | Same data + MockTripMetadata. |
| API client | `api/apiClient.ts` | `src/api/apiClient.ts` | Uses tokenStorage + getApiConfig(); no localStorage. |
| Auth service | `api/authService.ts` | `src/api/authService.ts` | login, register, getProfile, logout, etc.; tokens via tokenStorage. |
| Trip service | `api/tripService.ts` | `src/api/tripService.ts` | listTrips, getTripDetails, createTrip, user-groups, etc. |
| Trip mappers | (inside hooks) | `src/utils/tripMappers.ts` | mapUserTripListItemToFrontend, mapBackendTripToFrontend. |
| useTrips hooks | `hooks/useTrips.ts` | `src/hooks/useTrips.ts` | useUncompletedTrips, useTrip, useCreateTrip, etc. Uses src AppContext (user). |
| Constants | `constants.tsx` | `src/constants.ts` | COUNTRY_CODES, TRANSLATIONS (en/zh), MOCK_USER, MOCK_VEHICLES; API_CONFIG via getApiConfig(). |
| Config | (Vite env) | `src/config.ts` | setApiConfig() at startup; no import.meta. |
| Storage | (localStorage) | `src/storage.ts` | setTokenStorage() at startup; AsyncStorage in App. |

---

## ✅ App state (same shape as web)

`context/AppState.tsx` now exposes the same global state as web `AppContext`:

- user, setUser, lang, setLang, t (TRANSLATIONS[lang])
- currentScreen, setCurrentScreen (kept for compatibility; navigation is primary)
- dashboardShowHistory, setDashboardShowHistory
- selectedTripId, setSelectedTripId, selectedMemberId, setSelectedMemberId
- selectedVehicleId, setSelectedVehicleId, memberProfileSource, setMemberProfileSource
- searchQuery, setSearchQuery, selectedGroupArn, setSelectedGroupArn
- briefTrip, setBriefTrip, invitationDetails, setInvitationDetails
- **vehicles, setVehicles** (initialized with MOCK_VEHICLES)
- **friendIds, setFriendIds** (default: sarah_j, alen_w, jane_c, kevin_d)
- **pendingRequestIds, setPendingRequestIds** (default: michael_w)
- **incomingRequestIds, setIncomingRequestIds** (default: luna_z, driver_alex)
- **nicknames, setNicknames**, **notes, setNotes**

So when you convert Garage, Friends, and related screens, they can use the same `useApp()` shape as on web.

---

## ✅ API connection (no window/localStorage)

- **App.tsx** calls `setTokenStorage(AsyncStorageAdapter)` and `setApiConfig({ BASE_URL, HEADERS })` on startup.
- All requests use **tokenStorage** (AsyncStorage) and **getApiConfig()**; no `window` or `localStorage` in shared code.
- Screens use: **LoginScreen** (authService.login, getProfile), **AccountScreen** (authService.logout, tokenStorage), **TripDashboard** (useTrips → tripService), **RootNavigator** (getProfile for session restore).

---

## ✅ Navigation (all web routes represented)

- **Auth:** Login, Register, ResetPassword (stack).
- **Main tabs:** Trips, Friends, Add, Garage, Account.
- **Trips stack:** TripDashboard, TripDetail, TripSearch, TripBrief, TripInvitation, AddPassengerGroup, DriverProfile, PassengerGroupDetail, PassengerGroupBrief, ShareTrip, AddMemberSelection.
- **Friends stack:** Friends, FriendInvites, PeopleSearch, PeopleSearchResults, MemberProfile.
- **Add stack:** CreateTrip.
- **Garage stack:** Garage, VehicleForm.
- **Account stack:** Account, Settings, Support, ManageAccount, ModifyPassword.

Every web screen has a corresponding route; placeholders use the same screen names and params where applicable.

---

## ✅ UI converted (same layout as web)

- **LoginScreen** — Full layout (logo, lang, email/phone + password, country Modal, submit, reset/register).
- **AccountScreen** — Header, avatar, stats card, menu rows, logout.
- **SupportScreen** — Header, copy, email card, feedback textarea, FAQ.
- **SettingsScreen** — Header, language options, version.
- **TripDashboard** — Header (history/search), In Progress / Invited / Upcoming, trip cards, history list, Join Trip.
- **App shell** — Bottom tabs (Trips, Friends, Add, Garage, Account), SafeArea, providers.
- **Shared:** theme (colors, spacing, borderRadius, fontSize), Icon, Loading, Header.

---

## ⏳ Placeholder screens (nav + title only)

These routes exist and show “Screen in progress” + back; content still to be ported from web for full parity:

- Register, ResetPassword
- TripDetail, TripSearch, TripBrief, TripInvitation
- CreateTrip, Garage, VehicleForm
- Friends, FriendInvites, PeopleSearch, PeopleSearchResults, MemberProfile
- AddPassengerGroup, DriverProfile, PassengerGroupDetail, PassengerGroupBrief, ShareTrip, AddMemberSelection
- ManageAccount, ModifyPassword

When you convert each, use the same `useApp()` and navigation (and API where needed) so behavior stays the same as web.

---

## ✅ What was verified

1. **No browser-only APIs in mobile** — Only mentions of `localStorage`/`window` are in comments (e.g. storage.ts, api/index.ts).
2. **Types** — `src/types.ts` matches web `types.ts` (User, Vehicle, Trip, Participant, TripStatus, Location from tripService, etc.).
3. **Translations** — Same keys in `TRANSLATIONS.en` / `TRANSLATIONS.zh` as web; mobile adds `loading`.
4. **API surface** — Same auth and trip endpoints; token and config handled via abstractions.

---

## Summary

- **Reusable logic and data** are migrated and aligned (types, API, constants, hooks, state shape).
- **API** is connected with tokenStorage and setApiConfig; no window/localStorage in code.
- **Navigation** covers all web screens; five screens are fully converted, the rest are placeholders.
- **App state** matches web (including vehicles and friends state) so future screen conversions can rely on the same `useApp()`.

Remaining work for “everything the same” is to replace each placeholder screen with a React Native version of the corresponding web screen, reusing the same API and `useApp()`.
