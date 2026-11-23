import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../types/models';
import { isProductNameValid, isQuantityValid } from '../utils/validation';
import { STORAGE_KEYS } from './keys';
import { isPhotoReferenceValid } from '../utils/photoReference';
import { isProductLocationValid } from '../utils/productLocation';
import { isProductSupplierValid } from '../utils/productSupplier';

function isProductCalendarEventValid(value: unknown): boolean {
  return typeof value === 'object' && value !== null &&
    'eventId' in value && typeof value.eventId === 'string' && !!value.eventId &&
    'calendarId' in value && typeof value.calendarId === 'string' && !!value.calendarId &&
    'startDate' in value && typeof value.startDate === 'string' && !Number.isNaN(Date.parse(value.startDate)) &&
    Object.keys(value).every((key) => ['eventId', 'calendarId', 'startDate'].includes(key));
}

export async function getProducts(): Promise<Product[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((item: unknown) =>
    typeof item === 'object' && item !== null &&
    'id' in item && typeof item.id === 'string' && item.id.length > 0 &&
    'name' in item && typeof item.name === 'string' && isProductNameValid(item.name) &&
    'quantity' in item && typeof item.quantity === 'number' && isQuantityValid(item.quantity) &&
    'purchased' in item && typeof item.purchased === 'boolean' &&
    (!('photoUri' in item) || isPhotoReferenceValid(item.photoUri)) &&
    (!('location' in item) || item.location === undefined || isProductLocationValid(item.location)) &&
    (!('supplier' in item) || item.supplier === undefined || isProductSupplierValid(item.supplier)) &&
    (!('calendarEvent' in item) || item.calendarEvent === undefined || isProductCalendarEventValid(item.calendarEvent))
  )) {
    throw new Error('Los productos guardados no tienen un formato válido.');
  }
  return value as Product[];
}

export async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}
