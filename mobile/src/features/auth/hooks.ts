import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { loginUserApi, registerUserApi, LoginResponse, RegisterResponse, getMeApi } from './api';
import { useAuthStore } from './store';
import { AuthUser } from './storage';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  return {
    user,
    token,
    isInitialized,
    isAuthenticated: !!token && !!user,
  };
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<
    LoginResponse,
    AxiosError<{ message?: string }>,
    { email: string; password: string }
  >({
    mutationFn: ({ email, password }) => loginUserApi(email, password),
    onSuccess: async (data) => {
      await setSession(data.token, data.user);
    },
  });
}

export function useRegister() {
  return useMutation<
    RegisterResponse,
    AxiosError<{ message?: string }>,
    { name: string; email: string; password: string }
  >({
    mutationFn: ({ name, email, password }) =>
      registerUserApi(name, email, password),
  });
}

export function useSessionRestore() {
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);

  return useMutation<
    AuthUser,
    AxiosError<{ message?: string }>,
    void
  >({
    mutationFn: async () => {
      const data = await getMeApi();
      return data.user;
    },
    onSuccess: async (user) => {
      const token = useAuthStore.getState().token;
      if (token) {
        await setSession(token, user);
      }
    },
    onError: async () => {
      await logout();
    },
  });
}
