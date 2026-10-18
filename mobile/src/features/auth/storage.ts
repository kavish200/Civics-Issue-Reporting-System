import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'civics_auth_token';
const USER_KEY = 'civics_auth_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin';
  phone?: string;
  address?: string;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {}
}

export async function removeStoredToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch {}
}

export async function removeStoredUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {}
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([removeStoredToken(), removeStoredUser()]);
}
