# UI Rewrite Status (Web → React Native)

All web DOM elements are replaced with React Native equivalents; layout and styles match the web app using `StyleSheet` and `src/theme.ts` (colors, spacing, borderRadius).

## Mapping used

| Web | React Native |
|-----|--------------|
| `<div>` | `<View>` |
| `<span>` / `<p>` / `<h1>` | `<Text>` |
| `<button>` | `<Pressable>` or `<TouchableOpacity>` |
| `<img>` | `<Image>` |
| `<input>` / `<textarea>` | `<TextInput>` |
| CSS classes (Tailwind) | `StyleSheet.create()` + `src/theme` (colors, fontSize, spacing, borderRadius) |
| `document` / `localStorage` | Removed or replaced with RN APIs (e.g. `Modal`, `AsyncStorage` via `tokenStorage`) |

## Converted screens (same layout as web)

- **LoginScreen** — Logo, language switcher, email/phone + password form, country dropdown (Modal), switch method, submit, reset password & register links.
- **AccountScreen** — Sage header (no back), avatar + edit, stats card, menu rows (Personal Info, Security, Contact Us), logout.
- **SupportScreen** — Header, “Need a hand?”, email support card, feedback textarea + submit, FAQ row.
- **SettingsScreen** — Header, language options (ZH/EN), app version row.
- **TripDashboard** — Header (history/event + title + search), In Progress / Invited / Upcoming sections, trip cards (image, badge, time, origin→destination, status), history list, “Join Trip” button.

## App shell

- **App.tsx** — `SafeAreaProvider`, `QueryClientProvider`, `AppStateProvider`, `AppProvider` (user), token storage + API config init, screen switch by `currentScreen`, bottom tab bar (Trips, Friends, Add, Garage, Account) when logged in. Same max-width phone layout as web.

## Shared components

- **src/theme.ts** — Colors (sage, slate, morandi, ios gray), spacing, borderRadius, fontSize.
- **src/components/Icon.tsx** — Material-style icon names → `@expo/vector-icons` MaterialIcons.
- **src/components/Loading.tsx** — Car + road line animation, optional message.
- **src/components/Header.tsx** — Sage bar, optional back, title, optional right element.

## Placeholder (same nav, “Screen in progress” content)

These routes work and show a back button + title; content is still to be converted from web:

- Register, Reset Password
- Trip Detail, Trip Search, Trip Brief, Trip Invitation
- Create Trip, Garage, Add/Manage Vehicle
- Friends, Friend Invites, People Search, People Search Results
- Member Profile, Driver Profile
- Add Passenger Group, Passenger Group Detail/Brief, Share Trip, Add Member Selection
- Manage Account, Modify Password

## Next steps

1. Convert each placeholder screen from web `screens/*.tsx` to RN (View/Text/Pressable/Image/TextInput + StyleSheet).
2. Replace any remaining `document`/`localStorage` usage with RN patterns (e.g. `Modal`, `tokenStorage`).
3. Add swipe-to-reveal delete on trip cards if desired (e.g. `react-native-gesture-handler` + Animated).
