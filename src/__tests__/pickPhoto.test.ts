import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Picker from 'expo-image-picker';
import { pickPhoto } from '../photos/pickPhoto';

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(), requestCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(), requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn(),
}));

const granted = { status: 'granted', granted: true, canAskAgain: true, expires: 'never' } as Picker.CameraPermissionResponse;
const asset = { uri: 'file:///cache/photo.jpg', width: 10, height: 10 };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(Picker.getCameraPermissionsAsync).mockResolvedValue(granted);
  jest.mocked(Picker.getMediaLibraryPermissionsAsync).mockResolvedValue(granted);
  jest.mocked(Picker.launchCameraAsync).mockResolvedValue({ canceled: false, assets: [asset] });
  jest.mocked(Picker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [asset] });
});
it('abre cámara con permiso concedido sin volver a solicitarlo', async () => {
  expect(await pickPhoto('camera')).toEqual(asset);
  expect(Picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  expect(Picker.launchImageLibraryAsync).not.toHaveBeenCalled();
});
it('solicita permiso de galería antes del primer acceso', async () => {
  jest.mocked(Picker.getMediaLibraryPermissionsAsync).mockResolvedValue({ ...granted, granted: false, status: Picker.PermissionStatus?.UNDETERMINED ?? 'undetermined' as Picker.PermissionStatus });
  jest.mocked(Picker.requestMediaLibraryPermissionsAsync).mockResolvedValue(granted);
  expect(await pickPhoto('library')).toEqual(asset);
  expect(Picker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
});
it('permiso denegado no abre la cámara', async () => {
  jest.mocked(Picker.getCameraPermissionsAsync).mockResolvedValue({ ...granted, granted: false });
  jest.mocked(Picker.requestCameraPermissionsAsync).mockResolvedValue({ ...granted, granted: false });
  await expect(pickPhoto('camera')).rejects.toThrow('Permiso denegado');
  expect(Picker.launchCameraAsync).not.toHaveBeenCalled();
});
it('permiso bloqueado indica ajustes y no vuelve a pedir permiso', async () => {
  jest.mocked(Picker.getCameraPermissionsAsync).mockResolvedValue({ ...granted, granted: false, canAskAgain: false });
  await expect(pickPhoto('camera')).rejects.toThrow('ajustes');
  expect(Picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
});
it('cancelación devuelve null sin asociar una imagen', async () => {
  jest.mocked(Picker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
  expect(await pickPhoto('library')).toBeNull();
});
it('recurso no disponible muestra un error claro', async () => {
  jest.mocked(Picker.launchCameraAsync).mockRejectedValue(new Error('unavailable'));
  await expect(pickPhoto('camera')).rejects.toThrow('No se pudo abrir');
});
