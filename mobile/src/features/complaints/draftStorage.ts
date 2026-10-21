import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalDraft } from './types';

const DRAFTS_KEY = 'civics_complaint_drafts_v1';

export async function getLocalDrafts(): Promise<LocalDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalDraft[];
  } catch {
    return [];
  }
}

export async function saveLocalDraft(draft: LocalDraft): Promise<void> {
  try {
    const existing = await getLocalDrafts();
    const filtered = existing.filter((d) => d.id !== draft.id);
    const updated = [draft, ...filtered];
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  } catch {}
}

export async function removeLocalDraft(id: string): Promise<void> {
  try {
    const existing = await getLocalDrafts();
    const updated = existing.filter((d) => d.id !== id);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  } catch {}
}

export async function clearAllLocalDrafts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFTS_KEY);
  } catch {}
}
