import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, saveProducts } from '../storage/productStorage';
import { STORAGE_KEYS } from '../storage/keys';
import type { Product } from '../types/models';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

const product: Product = { id: '1', name: 'Pan', quantity: 1, purchased: false };

describe('persistencia de productos', () => {
  it('devuelve una lista vacía cuando no hay productos guardados', async () => {
    expect(await getProducts()).toEqual([]);
  });

  it('recupera el alta, el marcado y la eliminación después de guardarlos', async () => {
    await saveProducts([product]);
    expect(await getProducts()).toEqual([product]);
    const purchased = { ...product, purchased: true };
    await saveProducts([purchased]);
    expect(await getProducts()).toEqual([purchased]);
    await saveProducts([]);
    expect(await getProducts()).toEqual([]);
  });

  it('informa datos corruptos sin sobrescribirlos', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, '{');
    await expect(getProducts()).rejects.toThrow();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS)).toBe('{');
  });
});
