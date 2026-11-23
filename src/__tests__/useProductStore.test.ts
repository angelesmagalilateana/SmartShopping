import { beforeEach, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProductStore } from '../store/useProductStore';
import { STORAGE_KEYS } from '../storage/keys';
import { getProducts } from '../storage/productStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const oldProduct = { id: '1', name: 'Pan', quantity: 2, purchased: false };
let store: ReturnType<typeof createProductStore>;

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  jest.clearAllMocks();
  store = createProductStore();
});

it('carga productos anteriores sin migrarlos ni escribir al iniciar', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([oldProduct]));
  jest.clearAllMocks();
  await store.getState().load();
  expect(store.getState().products).toEqual([oldProduct]);
  expect(store.getState().loaded).toBe(true);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('comparte una carga en curso y no vuelve a cargar al regresar a Home', async () => {
  let resolve!: (value: string | null) => void;
  jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const first = store.getState().load();
  expect(store.getState().load()).toBe(first);
  expect(store.getState().loading).toBe(true);
  resolve(null);
  await first;
  await store.getState().load();
  expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  expect(store.getState().loading).toBe(false);
});

it('espera la carga inicial antes del alta y conserva los productos anteriores', async () => {
  let resolve!: (value: string | null) => void;
  jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const loading = store.getState().load();
  const adding = store.getState().add({ name: ' Leche ', quantity: 1 });
  await Promise.resolve();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  resolve(JSON.stringify([oldProduct]));
  await Promise.all([loading, adding]);
  expect(store.getState().products[0]).toEqual(oldProduct);
  expect(store.getState().products[1].name).toBe('Leche');
  expect(await getProducts()).toEqual(store.getState().products);
});

it('persiste alta, actualización, comprado, pendiente y eliminación al reiniciar', async () => {
  await store.getState().add({ name: 'Pan', quantity: 1 });
  const id = store.getState().products[0].id;
  await store.getState().update(id, { name: 'Pan integral', quantity: 3 });
  await store.getState().toggle(id);
  const restarted = createProductStore();
  await restarted.getState().load();
  expect(restarted.getState().products).toEqual([{ id, name: 'Pan integral', quantity: 3, purchased: true }]);
  await store.getState().toggle(id);
  expect((await getProducts())[0].purchased).toBe(false);
  await store.getState().remove(id);
  expect(await getProducts()).toEqual([]);
});

it('serializa escrituras y calcula cada cambio sobre el último estado', async () => {
  await store.getState().load();
  const original = AsyncStorage.setItem;
  let release!: () => void;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce((key, value) => new Promise<void>((resolve) => {
    release = () => { void original(key, value).then(resolve); };
  }));
  const first = store.getState().add({ name: 'Pan', quantity: 1 });
  const second = store.getState().add({ name: 'Leche', quantity: 2 });
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  expect(store.getState().products).toEqual([]);
  expect(store.getState().busy).toBe(true);
  release();
  await Promise.all([first, second]);
  expect(store.getState().products.map((product) => product.name)).toEqual(['Pan', 'Leche']);
  expect(await getProducts()).toEqual(store.getState().products);
  expect(store.getState().busy).toBe(false);
  const id = store.getState().products[0].id;
  await Promise.all([store.getState().toggle(id), store.getState().toggle(id)]);
  expect(store.getState().products[0].purchased).toBe(false);
});

it('genera identificadores distintos para altas en el mismo milisegundo', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(100);
  await Promise.all([store.getState().add({ name: 'Pan', quantity: 1 }), store.getState().add({ name: 'Sal', quantity: 1 })]);
  expect(store.getState().products.map((product) => product.id)).toEqual(['100', '101']);
});

it('no sobrescribe datos corruptos y permite reintentar la carga', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, '{');
  jest.clearAllMocks();
  await expect(store.getState().add({ name: 'Pan', quantity: 1 })).rejects.toThrow();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(store.getState().loadError).toBe('No se pudo cargar la lista. Intentá nuevamente.');
  expect(store.getState().loaded).toBe(false);
  expect(store.getState().busy).toBe(false);
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([oldProduct]));
  await store.getState().load();
  expect(store.getState().loadError).toBe('');
  expect(store.getState().products).toEqual([oldProduct]);
});

it('permite reintentar después de un error de lectura', async () => {
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('lectura'));
  await expect(store.getState().load()).rejects.toThrow('lectura');
  expect(store.getState().loading).toBe(false);
  await store.getState().load();
  expect(store.getState().loaded).toBe(true);
});

it('conserva memoria y disco si falla la escritura y continúa con la operación siguiente', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([oldProduct]));
  await store.getState().load();
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disco'));
  await expect(store.getState().remove('1')).rejects.toThrow('disco');
  expect(store.getState().products).toEqual([oldProduct]);
  expect(await getProducts()).toEqual([oldProduct]);
  expect(store.getState().error).toBe('No se pudo guardar el cambio. Intentá nuevamente.');
  await store.getState().toggle('1');
  expect(store.getState().error).toBe('');
  expect((await getProducts())[0].purchased).toBe(true);
});

it.each([{ name: ' ', quantity: 1 }, { name: 'Pan', quantity: 0 }, { name: 'Pan', quantity: 1.5 }])('rechaza altas inválidas: %j', async (input) => {
  await expect(store.getState().add(input)).rejects.toThrow();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(store.getState().products).toEqual([]);
});

it('rechaza una actualización inválida sin perder el producto', async () => {
  await store.getState().add({ name: 'Pan', quantity: 1 });
  const previous = store.getState().products;
  await expect(store.getState().update(previous[0].id, { quantity: -1 })).rejects.toThrow();
  expect(store.getState().products).toEqual(previous);
  expect(await getProducts()).toEqual(previous);
});
