import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';
import { selectSupplier } from '../contacts/selectSupplier';

jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(),
  Contact: { presentPicker: jest.fn() },
  ContactField: { FULL_NAME: 'fullName', PHONES: 'phones', EMAILS: 'emails' },
}));
const permission = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' } as Contacts.ContactsPermissionResponse;
const details = { fullName: ' Ana ', phones: [{ id: 'p', number: ' 123 ' }], emails: [{ id: 'e', address: 'ana@example.test' }], notes: 'private' };
const getDetails = jest.fn<() => Promise<typeof details>>();
const originalPlatform = Platform.OS;
beforeEach(() => {
  jest.resetAllMocks();
  Platform.OS = 'android';
  jest.mocked(Contacts.getPermissionsAsync).mockResolvedValue(permission);
  jest.mocked(Contacts.Contact.presentPicker).mockResolvedValue({ getDetails } as unknown as Contacts.Contact);
  getDetails.mockResolvedValue(details);
});
afterEach(() => { Platform.OS = originalPlatform; });
it('selecciona solo nombre y primer teléfono, sin datos adicionales', async () => {
  expect(await selectSupplier()).toEqual({ name: 'Ana', phone: '123' });
  expect(getDetails).toHaveBeenCalledWith(['fullName', 'phones', 'emails']);
  expect(Contacts.requestPermissionsAsync).not.toHaveBeenCalled();
});
it('solicita permiso pendiente antes de abrir el selector', async () => {
  jest.mocked(Contacts.getPermissionsAsync).mockResolvedValue({ ...permission, granted: false });
  let resolve!: (value: Contacts.ContactsPermissionResponse) => void;
  jest.mocked(Contacts.requestPermissionsAsync).mockImplementation(() => new Promise((done) => { resolve = done; }));
  const pending = selectSupplier();
  await new Promise<void>((done) => setImmediate(done));
  expect(Contacts.Contact.presentPicker).not.toHaveBeenCalled();
  resolve(permission);
  await expect(pending).resolves.toEqual({ name: 'Ana', phone: '123' });
});
it.each([true, false])('maneja denegación con canAskAgain=%s', async (canAskAgain) => {
  const denied = { ...permission, granted: false, canAskAgain };
  jest.mocked(Contacts.getPermissionsAsync).mockResolvedValue(denied);
  jest.mocked(Contacts.requestPermissionsAsync).mockResolvedValue(denied);
  await expect(selectSupplier()).rejects.toThrow(canAskAgain ? 'denegado' : 'bloqueado');
  expect(Contacts.Contact.presentPicker).not.toHaveBeenCalled();
  if (!canAskAgain) expect(Contacts.requestPermissionsAsync).not.toHaveBeenCalled();
});
it('cancelar devuelve null y no consulta detalles', async () => {
  jest.mocked(Contacts.Contact.presentPicker).mockResolvedValue(null);
  expect(await selectSupplier()).toBeNull();
  expect(getDetails).not.toHaveBeenCalled();
});
it('usa email si no hay teléfono', async () => {
  getDetails.mockResolvedValue({ ...details, phones: [] });
  expect(await selectSupplier()).toEqual({ name: 'Ana', email: 'ana@example.test' });
});
it('permite seleccionar contactos sin teléfono ni email', async () => {
  getDetails.mockResolvedValue({ ...details, phones: [], emails: [] });
  expect(await selectSupplier()).toEqual({ name: 'Ana' });
});
it('identifica un contacto sin nombre sin inventar datos de contacto', async () => {
  getDetails.mockResolvedValue({ ...details, fullName: '', phones: [], emails: [] });
  expect(await selectSupplier()).toEqual({ name: 'Contacto sin nombre' });
});
it('comunica errores al leer la selección', async () => {
  getDetails.mockRejectedValue(new Error('native error'));
  await expect(selectSupplier()).rejects.toThrow('No se pudo abrir la agenda');
});
it('web informa indisponibilidad sin solicitar permisos ni contactos', async () => {
  Platform.OS = 'web';
  await expect(selectSupplier()).rejects.toThrow('no está disponible');
  expect(Contacts.getPermissionsAsync).not.toHaveBeenCalled();
  expect(Contacts.Contact.presentPicker).not.toHaveBeenCalled();
});
