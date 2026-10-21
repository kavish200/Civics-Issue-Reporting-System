import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '../features/auth/store';
import { getStoredToken } from '../features/auth/storage';

export function getApiBaseUrl(): string {
  // 1. Try to read Metro packager host IP (e.g. 192.168.1.3:8081)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  const metroHost = hostUri ? hostUri.split(':')[0] : null;

  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    // If envUrl is pointing to 10.0.2.2 or localhost, but we're running on a physical phone via Metro LAN IP,
    // automatically rewrite it to the actual host IP so the phone never fails to connect!
    if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
      if (
        envUrl.includes('10.0.2.2') ||
        envUrl.includes('localhost') ||
        envUrl.includes('127.0.0.1')
      ) {
        return envUrl.replace(/10\.0\.2\.2|localhost|127\.0\.0\.1/, metroHost);
      }
    }
    return envUrl;
  }

  // 2. If Metro host is available and not localhost
  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
    return `http://${metroHost}:5001/api`;
  }

  // 3. Fallback to local Wi-Fi IP
  return 'http://192.168.1.3:5001/api';
}

export const API_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token || (await getStoredToken());
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const state = useAuthStore.getState();
      await state.logout();
      state.clearSessionExpired = () => useAuthStore.setState({ sessionExpired: false });
      useAuthStore.setState({ sessionExpired: true });
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  },
);
