/**
 * Token storage abstraction for auth.
 * Web can use localStorage; React Native should use AsyncStorage or SecureStore.
 * Call setTokenStorage() at app startup with your platform's storage.
 */

export interface TokenStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

let storage: TokenStorage | null = null;

export function setTokenStorage(s: TokenStorage): void {
  storage = s;
}

function getStorage(): TokenStorage {
  if (!storage) {
    throw new Error(
      'Token storage not set. Call setTokenStorage() at app startup (e.g. with AsyncStorage or a localStorage wrapper).'
    );
  }
  return storage;
}

async function getAsync(key: string): Promise<string | null> {
  const v = getStorage().getItem(key);
  return typeof (v as Promise<string | null>)?.then === 'function' ? (v as Promise<string | null>) : (v as string | null);
}

async function setAsync(key: string, value: string): Promise<void> {
  const r = getStorage().setItem(key, value);
  if (r && typeof (r as Promise<void>).then === 'function') await (r as Promise<void>);
}

async function removeAsync(key: string): Promise<void> {
  const r = getStorage().removeItem(key);
  if (r && typeof (r as Promise<void>).then === 'function') await (r as Promise<void>);
}

export const tokenStorage = {
  getToken: (key: 'idToken' | 'accessToken' | 'refreshToken' = 'idToken'): string | null => {
    const v = getStorage().getItem(key);
    return typeof v === 'string' ? v : null;
  },
  getTokenAsync: async (key: 'idToken' | 'accessToken' | 'refreshToken' = 'idToken'): Promise<string | null> => {
    return getAsync(key);
  },
  setTokens: (tokens: { accessToken?: string; idToken?: string; refreshToken?: string }): void => {
    const s = getStorage();
    if (tokens.accessToken) s.setItem('accessToken', tokens.accessToken);
    if (tokens.idToken) s.setItem('idToken', tokens.idToken);
    if (tokens.refreshToken) s.setItem('refreshToken', tokens.refreshToken);
  },
  setTokensAsync: async (tokens: { accessToken?: string; idToken?: string; refreshToken?: string }): Promise<void> => {
    const s = getStorage();
    if (tokens.accessToken) await setAsync('accessToken', tokens.accessToken);
    if (tokens.idToken) await setAsync('idToken', tokens.idToken);
    if (tokens.refreshToken) await setAsync('refreshToken', tokens.refreshToken);
  },
  clearTokens: (): void => {
    const s = getStorage();
    s.removeItem('accessToken');
    s.removeItem('idToken');
    s.removeItem('refreshToken');
  },
  clearTokensAsync: async (): Promise<void> => {
    await removeAsync('accessToken');
    await removeAsync('idToken');
    await removeAsync('refreshToken');
  },
};
