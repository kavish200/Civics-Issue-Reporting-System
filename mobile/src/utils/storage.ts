import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export const DRAFTS_KEY = '@civics_drafts';
export const COMPLAINTS_CACHE_KEY = '@civics_complaints_cache';
export const PUSH_TOKEN_KEY = '@civics_push_token';
export const AUTH_TOKEN_KEY = '@civics_auth_token';

export interface DraftReport {
  id: string;
  clientId: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  imageFileName?: string;
  createdAt: string;
  error?: string;
  lastAttemptError?: string;
}

export async function saveDraft(draft: DraftReport): Promise<void> {
  try {
    const drafts = await getDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

export async function getDrafts(): Promise<DraftReport[]> {
  try {
    const data = await AsyncStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to get drafts:', err);
    return [];
  }
}

export async function deleteDraft(draftId: string): Promise<void> {
  try {
    const drafts = await getDrafts();
    const draft = drafts.find((d) => d.id === draftId);
    if (draft?.imageFileName) {
      const imagePath = `${FileSystem.documentDirectory}${draft.imageFileName}`;
      await FileSystem.deleteAsync(imagePath, { idempotent: true });
    }
    const filtered = drafts.filter((d) => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete draft:', err);
  }
}

export async function cacheComplaintsList(data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPLAINTS_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to cache complaints:', err);
  }
}

export async function getCachedComplaintsList(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(COMPLAINTS_CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to get cached complaints:', err);
    return null;
  }
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

export async function getPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to get push token:', err);
    return null;
  }
}

export async function copyImageToDrafts(sourceUri: string): Promise<string> {
  try {
    const fileName = `draft_${Date.now()}.jpg`;
    const destPath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });
    return fileName;
  } catch (err) {
    console.error('Failed to copy image:', err);
    throw err;
  }
}

export async function getDraftImageUri(fileName: string): Promise<string> {
  return `${FileSystem.documentDirectory}${fileName}`;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to get auth token:', err);
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save auth token:', err);
  }
}
