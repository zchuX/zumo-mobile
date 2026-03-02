import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getApiConfig } from '../config';
import { tokenStorage } from '../storage';

let apiClient: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!apiClient) {
    const config = getApiConfig();
    apiClient = axios.create({
      baseURL: config.BASE_URL,
      headers: config.HEADERS,
    });
    apiClient.interceptors.request.use(
      async (config) => {
        const idToken = await tokenStorage.getTokenAsync('idToken');
        if (idToken && config.url !== '/auth/logout') {
          config.headers.Authorization = `Bearer ${idToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    apiClient.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      responseErrorHandler
    );
  }
  return apiClient;
}

function responseErrorHandler(error: AxiosError) {

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as Record<string, unknown> | undefined;
    const message = typeof data?.message === 'string' ? data.message : undefined;
    switch (status) {
      case 401:
        tokenStorage.clearTokensAsync().catch(() => {});
        return Promise.reject(new Error(message ?? 'Unauthorized'));
      case 403:
        return Promise.reject(new Error(message ?? 'Access denied.'));
      case 409:
        return Promise.reject(error);
      case 423: {
        const retryAfter = error.response.headers['retry-after'];
        const msg = retryAfter
          ? `Account locked. Try again in ${retryAfter} seconds.`
          : 'Account locked.';
        return Promise.reject(new Error(msg));
      }
      case 429: {
        const retryAfter = error.response.headers['retry-after'];
        const msg = retryAfter
          ? `Too many requests. Try again in ${retryAfter} seconds.`
          : 'Too many requests.';
        return Promise.reject(new Error(msg));
      }
      default:
        return Promise.reject(error);
    }
  }
  return Promise.reject(error);
}

const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    getClient().get(url, config) as Promise<T>,
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    getClient().post(url, data, config) as Promise<T>,
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    getClient().put(url, data, config) as Promise<T>,
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    getClient().delete(url, config) as Promise<T>,
};

export default api;
