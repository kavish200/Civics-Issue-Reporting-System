import { create } from 'zustand';
import {
  AuthUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearStoredSession,
} from './storage';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isInitialized: boolean;
  sessionExpired: boolean;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearSessionExpired: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isInitialized: false,
  sessionExpired: false,

  setSession: async (token: string, user: AuthUser) => {
    await setStoredToken(token);
    await setStoredUser(user);
    set({ token, user, sessionExpired: false });
  },

  updateUser: async (user: AuthUser) => {
    await setStoredUser(user);
    set({ user });
  },

  logout: async () => {
    await clearStoredSession();
    set({ token: null, user: null, sessionExpired: false });
  },

  bootstrap: async () => {
    const [token, user] = await Promise.all([getStoredToken(), getStoredUser()]);
    set({ token, user, isInitialized: true });
  },

  clearSessionExpired: () => {
    set({ sessionExpired: false });
  },
}));
