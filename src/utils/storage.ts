import * as SecureStore from 'expo-secure-store';

const USER_KEY = 'fsv_user';

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
}

export async function getStoredUser(): Promise<StoredUser | null> {
  try {
    const json = await SecureStore.getItemAsync(USER_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}
