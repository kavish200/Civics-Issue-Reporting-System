import { apiClient } from '../../api';
import { AuthUser } from './storage';

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export async function loginUserApi(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/users/login', {
    email: email.trim().toLowerCase(),
    password,
  });
  return response.data;
}

export async function registerUserApi(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/users/register', {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });
  return response.data;
}

export async function getMeApi(): Promise<{ user: AuthUser }> {
  const response = await apiClient.get<{ user: AuthUser }>('/users/me');
  return response.data;
}

export async function savePushTokenApi(token: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/users/push-token', { token });
  return response.data;
}
