import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../types/models';
import { isProductNameValid, isQuantityValid } from '../utils/validation';
import { STORAGE_KEYS } from './keys';

export async function getProducts(): Promise<Product[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((item: unknown) =>
    typeof item === 'object' && item !== null &&
    'id' in item && typeof item.id === 'string' && item.id.length > 0 &&
    'name' in item && typeof item.name === 'string' && isProductNameValid(item.name) &&
    'quantity' in item && typeof item.quantity === 'number' && isQuantityValid(item.quantity) &&
    'purchased' in item && typeof item.purchased === 'boolean'
  )) {
    throw new Error('Los productos guardados no tienen un formato válido.');
  }
  return value as Product[];
}

export async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}
