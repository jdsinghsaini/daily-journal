import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DEFAULT_SETTINGS, emptyData, type AppData } from './types';

const DATA_KEY = 'daily-journal:v1';

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(DATA_KEY);
    if (!raw) return emptyData();
    const d = JSON.parse(raw) as Partial<AppData>;
    return {
      version: 1,
      entries: d.entries || {},
      capsules: d.capsules || {},
      settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
    };
  } catch {
    return emptyData();
  }
}

export async function saveData(data: AppData) {
  try {
    await AsyncStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save journal', e);
  }
}

/** Secrets (PIN hash, API key) go to the Keychain / Keystore on phones. */
export async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem('secure:' + key);
  return SecureStore.getItemAsync(key);
}

export async function secureSet(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value === null) await AsyncStorage.removeItem('secure:' + key);
    else await AsyncStorage.setItem('secure:' + key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
