import { beforeEach, expect, it, jest } from '@jest/globals';
import { File, Paths } from 'expo-file-system';
import { savePhoto, resolvePhoto, deletePhoto } from '../storage/photoStorage';

jest.mock('expo-file-system', () => {
  const copy = jest.fn();
  const remove = jest.fn();
  return {
    Paths: { document: 'file:///documents' },
    Directory: class { uri = 'file:///documents/product-photos'; create = jest.fn(); },
    File: class {
      uri: string; exists = true; copy = copy; delete = remove;
      constructor(parent: string | { uri: string }, name?: string) { this.uri = typeof parent === 'string' ? parent : `${parent.uri}/${name}`; }
    },
  };
});
beforeEach(() => { jest.clearAllMocks(); });
it('copia la imagen de caché al directorio de documentos', async () => {
  const uri = await savePhoto({ uri: 'file:///cache/photo.jpg', width: 10, height: 10 });
  expect(uri).toMatch(/^file:\/\/\/documents\/product-photos\/.+\.jpg$/);
  expect(new File(Paths.document).copy).toHaveBeenCalledTimes(1);
  expect(await resolvePhoto(uri)).toBe(uri);
});
it('solo elimina archivos administrados por la aplicación', async () => {
  await deletePhoto('file:///other/photo.jpg');
  expect(new File(Paths.document).delete).not.toHaveBeenCalled();
  await deletePhoto('file:///documents/product-photos/photo.jpg');
  expect(new File(Paths.document).delete).toHaveBeenCalledTimes(1);
});
