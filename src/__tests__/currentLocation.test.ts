import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import * as Location from 'expo-location';
import { getCommerceLocation, LOCATION_TIMEOUT_MS } from '../location/currentLocation';

jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(), hasServicesEnabledAsync: jest.fn(), getCurrentPositionAsync: jest.fn(), Accuracy: { Balanced: 3 } }));
const permission = { granted: true, status: 'granted', canAskAgain: true, expires: 'never' } as Location.LocationPermissionResponse;
const position = { coords: { latitude: -34.6, longitude: -58.4 } } as Location.LocationObject;
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue(permission);
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue(position);
});
afterEach(() => { jest.useRealTimers(); });
it('solicita permiso en primer plano y obtiene coordenadas actuales', async () => {
  expect(await getCommerceLocation()).toEqual(position.coords);
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith(expect.objectContaining({ maximumAge: 0 }));
});
it('espera la respuesta al permiso antes de acceder a la posición', async () => {
  let allow!: (value: Location.LocationPermissionResponse) => void;
  jest.mocked(Location.requestForegroundPermissionsAsync).mockImplementationOnce(() => new Promise((resolve) => { allow = resolve; }));
  const pending = getCommerceLocation();
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  allow(permission);
  await expect(pending).resolves.toEqual(position.coords);
});
it.each([true, false])('rechaza permiso denegado, canAskAgain=%s', async (canAskAgain) => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ ...permission, granted: false, canAskAgain });
  await expect(getCommerceLocation()).rejects.toThrow(canAskAgain ? 'denegado' : 'bloqueado');
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
it('informa ubicación desactivada', async () => {
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(false);
  await expect(getCommerceLocation()).rejects.toThrow('desactivada');
});
it('informa errores del proveedor', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockRejectedValue(new Error('unavailable'));
  await expect(getCommerceLocation()).rejects.toThrow('No se pudo obtener');
});
it('rechaza coordenadas inválidas', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ ...position, coords: { ...position.coords, latitude: NaN } });
  await expect(getCommerceLocation()).rejects.toThrow('coordenadas válidas');
});
it('limita el tiempo de búsqueda y permite reintentar', async () => {
  jest.useFakeTimers();
  jest.mocked(Location.getCurrentPositionAsync).mockImplementationOnce(() => new Promise(() => {}));
  const result = expect(getCommerceLocation()).rejects.toThrow('tardó demasiado');
  await jest.advanceTimersByTimeAsync(LOCATION_TIMEOUT_MS + 1);
  await result;
  expect(await getCommerceLocation()).toEqual(position.coords);
});
it('limita la espera del permiso sin iniciar una búsqueda tardía', async () => {
  jest.useFakeTimers();
  let allow!: (value: Location.LocationPermissionResponse) => void;
  jest.mocked(Location.requestForegroundPermissionsAsync).mockImplementationOnce(() => new Promise((resolve) => { allow = resolve; }));
  const result = expect(getCommerceLocation()).rejects.toThrow('tardó demasiado');
  await jest.advanceTimersByTimeAsync(LOCATION_TIMEOUT_MS + 1);
  await result;
  allow(permission);
  await Promise.resolve();
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
