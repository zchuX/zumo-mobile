/**
 * API config abstraction so the same code works on web (Vite env) and native (Expo env or app config).
 * Call setApiConfig() at app startup with your base URL and headers.
 */

export interface ApiConfig {
  BASE_URL: string;
  HEADERS: Record<string, string>;
}

const defaultConfig: ApiConfig = {
  BASE_URL: 'https://ltr38e7hx8.execute-api.us-east-1.amazonaws.com/dev',
  HEADERS: {
    'Content-Type': 'application/json',
    'x-api-key': '3CDSGzm1IH3q7ixup3hJ84B534K9Fe7Y5NrDoCmr',
  },
};

let apiConfig: ApiConfig = defaultConfig;

export function setApiConfig(config: Partial<ApiConfig>): void {
  apiConfig = { ...apiConfig, ...config };
}

export function getApiConfig(): ApiConfig {
  return apiConfig;
}
