import api from './apiClient';
import { tokenStorage } from '../storage';

interface LoginParams {
  email?: string;
  phone_number?: string;
  password?: string;
}

interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

interface RegisterParams {
  password?: string;
  name: string;
  email?: string;
  phone_number?: string;
}

interface VerifyCodeParams {
  email?: string;
  phone_number?: string;
  code: string;
}

interface ResetPasswordParams {
  email?: string;
  phone_number?: string;
}

interface ConfirmResetPasswordParams {
  email?: string;
  phone_number?: string;
  code: string;
  newPassword?: string;
}

export interface UserProfile {
  id: string;
  userArn?: string;
  email?: string;
  phone_number?: string;
  name?: string;
  imageUrl?: string;
  photoUrl?: string;
}

export const login = async (params: LoginParams): Promise<LoginResponse> => {
  if (!params.email && !params.phone_number) {
    throw new Error('Email or phone number is required');
  }
  const response = await api.post<LoginResponse>('/auth/login', params);
  await tokenStorage.setTokensAsync({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    idToken: response.idToken,
  });
  return response;
};

export const refreshToken = async (token: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/refresh-token', { refreshToken: token });
  await tokenStorage.setTokensAsync({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    idToken: response.idToken,
  });
  return response;
};

export const register = async (params: RegisterParams): Promise<unknown> => {
  if (!params.email && !params.phone_number) {
    throw new Error('Email or phone number is required');
  }
  return api.post('/auth/register', params);
};

export const verifyCode = async (params: VerifyCodeParams): Promise<unknown> => {
  return api.post('/auth/verify-code', params);
};

export const sendResetCode = async (params: ResetPasswordParams): Promise<unknown> => {
  return api.post('/auth/reset-password', params);
};

export const confirmReset = async (params: ConfirmResetPasswordParams): Promise<unknown> => {
  return api.post('/auth/reset-password/confirm', params);
};

export const getProfile = async (): Promise<UserProfile> => {
  return api.get<UserProfile>('/auth/me');
};

export const logout = async (refreshTokenParam: string): Promise<unknown> => {
  return api.post('/auth/logout', { refreshToken: refreshTokenParam });
};
