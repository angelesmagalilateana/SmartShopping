import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '../types/models';
import { isRequiredFieldValid } from '../utils/validation';
import { STORAGE_KEYS } from './keys';

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' && value !== null &&
      'username' in value && typeof value.username === 'string' &&
      'password' in value && typeof value.password === 'string' &&
      isRequiredFieldValid(value.username) && isRequiredFieldValid(value.password)
    ) {
      return { username: value.username, password: value.password };
    }
  } catch {
    // Invalid stored data must not grant access.
  }
  return null;
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' && value !== null &&
      'username' in value && typeof value.username === 'string' &&
      isRequiredFieldValid(value.username)
    ) {
      return { username: value.username };
    }
  } catch {
    // Invalid stored data must not grant access.
  }
  return null;
}

export async function removeSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
}
