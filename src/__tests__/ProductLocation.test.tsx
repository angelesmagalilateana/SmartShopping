import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProductLocation from '../components/ProductLocation';
import { getCommerceLocation } from '../location/currentLocation';
import type { ProductLocation as Coordinates } from '../types/models';

jest.mock('../location/currentLocation', () => ({ getCommerceLocation: jest.fn() }));
jest.setTimeout(30000);
const location = { latitude: -34, longitude: -58 };
beforeEach(() => { jest.resetAllMocks(); });
it('no solicita permisos al renderizar y muestra coordenadas existentes', async () => {
  await render(<ProductLocation location={location} onChange={async () => {}} />);
  expect(getCommerceLocation).not.toHaveBeenCalled();
  expect(screen.getByText('Ubicación del comercio: -34.000000, -58.000000')).toBeTruthy();
});
it('asocia la ubicación únicamente después de pulsar el botón', async () => {
  jest.mocked(getCommerceLocation).mockResolvedValue(location);
  const change = jest.fn<(value?: Coordinates) => Promise<void>>().mockResolvedValue(undefined);
  await render(<ProductLocation onChange={change} />);
  await fireEvent.press(screen.getByText('Asociar ubicación actual'));
  expect(change).toHaveBeenCalledWith(location);
});
it('un error de permisos conserva la ubicación y permite reintentar', async () => {
  jest.mocked(getCommerceLocation).mockRejectedValueOnce(new Error('Permiso denegado')).mockResolvedValue(location);
  const change = jest.fn<(value?: Coordinates) => Promise<void>>().mockResolvedValue(undefined);
  await render(<ProductLocation location={location} onChange={change} />);
  await fireEvent.press(screen.getByText('Actualizar ubicación'));
  expect(screen.getByText('Permiso denegado')).toBeTruthy();
  expect(change).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Actualizar ubicación'));
  expect(change).toHaveBeenCalledWith(location);
});
it('quitar ubicación no solicita acceso al GPS y comunica fallos de guardado', async () => {
  const change = jest.fn<(value?: Coordinates) => Promise<void>>().mockRejectedValue(new Error('disco'));
  await render(<ProductLocation location={location} onChange={change} />);
  await fireEvent.press(screen.getByText('Quitar ubicación'));
  await waitFor(() => expect(change).toHaveBeenCalledWith(undefined));
  expect(getCommerceLocation).not.toHaveBeenCalled();
  expect(screen.getByText(/La ubicación anterior se conserva/)).toBeTruthy();
});
