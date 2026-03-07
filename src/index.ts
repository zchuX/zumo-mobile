/**
 * Shared code for Zumo mobile app (API, types, constants, utils).
 * Set up at app startup:
 * - setTokenStorage(yourStorage) for auth tokens (e.g. AsyncStorage wrapper)
 * - setApiConfig({ BASE_URL, HEADERS }) for API base URL and headers
 */

export { setTokenStorage, tokenStorage } from './storage';
export type { TokenStorage } from './storage';

export { setApiConfig, getApiConfig } from './config';
export type { ApiConfig } from './config';

export * from './types';
export * from './constants';
export { tripKeys } from './data/trips/keys';

export { default as api } from './api/apiClient';
export * from './api/authService';
export * from './api/tripService';
export * from './api/friendsService';
export * from './api/userService';
export * from './api/mockTrips';

export { mapUserTripListItemToFrontend, mapBackendTripToFrontend } from './utils/tripMappers';

export { AppProvider, useApp } from './AppContext';
export type { AppContextValue } from './AppContext';

export * from './hooks/useTrips';
export * from './hooks/useFriends';
export * from './hooks/useUsers';
