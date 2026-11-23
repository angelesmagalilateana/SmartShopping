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

it('asocia, sustituye y quita una foto conservando el resto del producto y la persistencia', async () => {
  await store.getState().add({ name: 'Pan', quantity: 1, photoUri: 'file:///documents/first.jpg' });
  const id = store.getState().products[0].id;
  expect((await getProducts())[0].photoUri).toBe('file:///documents/first.jpg');
  await store.getState().update(id, { photoUri: 'file:///documents/second.jpg' });
  const restarted = createProductStore();
  await restarted.getState().load();
  expect(restarted.getState().products[0]).toEqual({ id, name: 'Pan', quantity: 1, purchased: false, photoUri: 'file:///documents/second.jpg' });
  await store.getState().update(id, { photoUri: undefined });
  expect((await getProducts())[0].photoUri).toBeUndefined();
});

it('un fallo al reemplazar una foto conserva la referencia anterior', async () => {
  await store.getState().add({ name: 'Pan', quantity: 1, photoUri: 'file:///documents/first.jpg' });
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disco'));
  await expect(store.getState().update(store.getState().products[0].id, { photoUri: 'file:///documents/second.jpg' })).rejects.toThrow();
  expect(store.getState().products[0].photoUri).toBe('file:///documents/first.jpg');
  expect((await getProducts())[0].photoUri).toBe('file:///documents/first.jpg');
});

it.each(['data:image/jpeg;base64,abc', 'blob:temporary'])('rechaza referencias temporales o base64: %s', async (photoUri) => {
  await expect(store.getState().add({ name: 'Pan', quantity: 1, photoUri })).rejects.toThrow('referencia');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('asocia, actualiza, recarga y quita ubicación sin modificar la foto ni los datos anteriores', async () => {
  await store.getState().add({ name: 'Pan', quantity: 1, photoUri: 'file:///documents/a.jpg' });
  const id = store.getState().products[0].id;
  await store.getState().update(id, { location: { latitude: -34, longitude: -58 } });
  expect((await getProducts())[0].location).toEqual({ latitude: -34, longitude: -58 });
  await store.getState().update(id, { location: { latitude: 0, longitude: 0 } });
  const restarted = createProductStore();
  await restarted.getState().load();
  expect(restarted.getState().products[0].location).toEqual({ latitude: 0, longitude: 0 });
  expect(restarted.getState().products[0].photoUri).toBe('file:///documents/a.jpg');
  await store.getState().update(id, { location: undefined });
  expect((await getProducts())[0].location).toBeUndefined();
});

it('fallar el guardado de ubicación conserva el estado anterior', async () => {
  const location = { latitude: -34, longitude: -58 };
  await store.getState().add({ name: 'Pan', quantity: 1, location });
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disco'));
  await expect(store.getState().update(store.getState().products[0].id, { location: undefined })).rejects.toThrow();
  expect(store.getState().products[0].location).toEqual(location);
  expect((await getProducts())[0].location).toEqual(location);
});

it.each([{ latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: Infinity, longitude: 0 }])('rechaza ubicaciones inválidas %j', async (location) => {
  await expect(store.getState().add({ name: 'Pan', quantity: 1, location })).rejects.toThrow('ubicación');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('asocia, cambia, recarga y quita proveedor conservando datos anteriores', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([oldProduct]));
  await store.getState().update('1', { supplier: { name: 'Ana', phone: '123' } });
  expect((await getProducts())[0].supplier).toEqual({ name: 'Ana', phone: '123' });
  await store.getState().update('1', { supplier: { name: 'Luis', email: 'luis@example.test' } });
  const restarted = createProductStore();
  await restarted.getState().load();
  expect(restarted.getState().products[0]).toEqual({ ...oldProduct, supplier: { name: 'Luis', email: 'luis@example.test' } });
  await store.getState().update('1', { supplier: undefined });
  expect(await getProducts()).toEqual([oldProduct]);
});

it('fallar al cambiar proveedor conserva memoria y persistencia', async () => {
  const supplier = { name: 'Ana' };
  await store.getState().add({ name: 'Pan', quantity: 1, supplier });
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disco'));
  await expect(store.getState().update(store.getState().products[0].id, { supplier: { name: 'Luis' } })).rejects.toThrow();
  expect(store.getState().products[0].supplier).toEqual(supplier);
  expect((await getProducts())[0].supplier).toEqual(supplier);
});
it.each([{ name: '' }, { name: 'Ana', phone: '' }, { name: 'Ana', notes: 'No almacenar' }])('rechaza proveedor inválido o datos adicionales: %j', async (supplier) => {
  await expect(store.getState().add({ name: 'Pan', quantity: 1, supplier })).rejects.toThrow('proveedor');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('persiste metadatos de calendario y mantiene productos antiguos sin ese campo', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([oldProduct]));
  await store.getState().load();
  expect(store.getState().products[0]).toEqual(oldProduct);
  const event = { eventId: 'event-1', calendarId: 'cal-1', startDate: '2027-01-01T10:00:00.000Z' };
  await store.getState().update('1', { calendarEvent: event });
  const restarted = createProductStore();
  await restarted.getState().load();
  expect(restarted.getState().products[0].calendarEvent).toEqual(event);
  await store.getState().update('1', { calendarEvent: undefined });
});
