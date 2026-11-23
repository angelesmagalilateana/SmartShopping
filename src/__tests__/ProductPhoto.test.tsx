import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProductPhoto from '../components/ProductPhoto';
import { pickPhoto } from '../photos/pickPhoto';
import { savePhoto, deletePhoto, resolvePhoto } from '../storage/photoStorage';
// The first native render is slow when Jest starts without its transform cache.
jest.setTimeout(30000);

jest.mock('../photos/pickPhoto', () => ({ pickPhoto: jest.fn() }));
jest.mock('../storage/photoStorage', () => ({ savePhoto: jest.fn(), deletePhoto: jest.fn(), resolvePhoto: jest.fn(), releasePhoto: jest.fn() }));
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(resolvePhoto).mockResolvedValue('file:///old.jpg');
  jest.mocked(deletePhoto).mockResolvedValue(undefined);
  jest.mocked(savePhoto).mockResolvedValue('file:///new.jpg');
});
it('cancelar conserva la foto anterior y no escribe', async () => {
  jest.mocked(pickPhoto).mockResolvedValue(null);
  const change = jest.fn<(uri?: string) => Promise<void>>();
  await render(<ProductPhoto reference="file:///old.jpg" onChange={change} />);
  await fireEvent.press(screen.getByText('Elegir de galería'));
  expect(change).not.toHaveBeenCalled();
  expect(savePhoto).not.toHaveBeenCalled();
  expect(deletePhoto).not.toHaveBeenCalled();
});
it('elimina el archivo nuevo si falla guardar su referencia', async () => {
  jest.mocked(pickPhoto).mockResolvedValue({ uri: 'file:///cache.jpg', width: 10, height: 10 });
  const change = jest.fn<(uri?: string) => Promise<void>>().mockRejectedValue(new Error('No se pudo guardar'));
  await render(<ProductPhoto reference="file:///old.jpg" onChange={change} />);
  await fireEvent.press(screen.getByText('Tomar foto'));
  await waitFor(() => expect(deletePhoto).toHaveBeenCalledWith('file:///new.jpg'));
  expect(deletePhoto).not.toHaveBeenCalledWith('file:///old.jpg');
  expect(screen.getByText('No se pudo guardar')).toBeTruthy();
});
it('quitar foto guarda la referencia vacía antes de borrar el archivo', async () => {
  const change = jest.fn<(uri?: string) => Promise<void>>().mockResolvedValue(undefined);
  await render(<ProductPhoto reference="file:///old.jpg" onChange={change} />);
  await fireEvent.press(screen.getByText('Quitar foto'));
  await waitFor(() => expect(change).toHaveBeenCalledWith(undefined));
  expect(deletePhoto).toHaveBeenCalledWith('file:///old.jpg');
  expect(change.mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(deletePhoto).mock.invocationCallOrder[0]);
});
it('informa permisos denegados sin modificar la asociación', async () => {
  jest.mocked(pickPhoto).mockRejectedValue(new Error('Permiso denegado'));
  const change = jest.fn<(uri?: string) => Promise<void>>();
  await render(<ProductPhoto onChange={change} />);
  await fireEvent.press(screen.getByText('Tomar foto'));
  expect(screen.getByText('Permiso denegado')).toBeTruthy();
  expect(change).not.toHaveBeenCalled();
});
