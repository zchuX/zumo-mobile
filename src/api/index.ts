/**
 * API layer — reuse from web project.
 * No window or localStorage: uses tokenStorage and getApiConfig() set at app startup.
 */
export { default as api } from './apiClient';
export * from './authService';
export * from './tripService';
export * from './mockTrips';
