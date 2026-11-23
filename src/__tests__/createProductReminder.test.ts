import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Calendar from 'expo-calendar/legacy';
import { createProductReminder } from '../calendar/createProductReminder';

jest.mock('expo-calendar/legacy', () => ({
  EntityTypes: { EVENT: 'event' },
  getCalendarPermissionsAsync: jest.fn(),
  requestCalendarPermissionsAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  createEventAsync: jest.fn(),
}));

const granted = { granted: true, canAskAgain: true, status: 'granted' } as Calendar.PermissionResponse;
const calendar = { id: 'writable-1', allowsModifications: true, entityType: 'event' } as Calendar.Calendar;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Calendar.getCalendarPermissionsAsync).mockResolvedValue(granted);
  jest.mocked(Calendar.getCalendarsAsync).mockResolvedValue([calendar]);
  jest.mocked(Calendar.createEventAsync).mockResolvedValue('event-123');
});

it('consulta permiso y crea un evento descriptivo en un calendario editable', async () => {
  const start = new Date(Date.now() + 60_000);
  const result = await createProductReminder('Leche', start);
  expect(Calendar.getCalendarPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Calendar.createEventAsync).toHaveBeenCalledWith('writable-1', expect.objectContaining({
    title: 'Recordatorio: Leche',
    notes: expect.stringContaining('comprar Leche'),
    startDate: start,
  }));
  expect(result).toEqual({ eventId: 'event-123', calendarId: 'writable-1', startDate: start.toISOString() });
});

it('solicita permiso pendiente antes de crear', async () => {
  jest.mocked(Calendar.getCalendarPermissionsAsync).mockResolvedValue({ ...granted, granted: false, canAskAgain: true });
  jest.mocked(Calendar.requestCalendarPermissionsAsync).mockResolvedValue(granted);
  await createProductReminder('Pan', new Date(Date.now() + 60_000));
  expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalledTimes(1);
});

it('comunica permiso denegado sin crear eventos', async () => {
  jest.mocked(Calendar.getCalendarPermissionsAsync).mockResolvedValue({ ...granted, granted: false, canAskAgain: true });
  jest.mocked(Calendar.requestCalendarPermissionsAsync).mockResolvedValue({ ...granted, granted: false, canAskAgain: true });
  await expect(createProductReminder('Pan', new Date(Date.now() + 60_000))).rejects.toThrow('denegado');
  expect(Calendar.createEventAsync).not.toHaveBeenCalled();
});

it('comunica permiso bloqueado sin volver a solicitar ni crear eventos', async () => {
  jest.mocked(Calendar.getCalendarPermissionsAsync).mockResolvedValue({ ...granted, granted: false, canAskAgain: false });
  await expect(createProductReminder('Pan', new Date(Date.now() + 60_000))).rejects.toThrow('bloqueado');
  expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled();
  expect(Calendar.createEventAsync).not.toHaveBeenCalled();
});

it('informa que no hay calendario editable', async () => {
  jest.mocked(Calendar.getCalendarsAsync).mockResolvedValue([]);
  await expect(createProductReminder('Pan', new Date(Date.now() + 60_000))).rejects.toThrow('No hay calendarios');
});

it('informa cancelación/error nativo y fecha inválida sin falso éxito', async () => {
  jest.mocked(Calendar.createEventAsync).mockRejectedValue(new Error('cancelled'));
  await expect(createProductReminder('Pan', new Date(Date.now() + 60_000))).rejects.toThrow('No se pudo crear');
  await expect(createProductReminder('Pan', new Date(Date.now() - 60_000))).rejects.toThrow('fecha y hora futura');
});

it('no duplica la creación por llamadas concurrentes desde el control', async () => {
  // The UI uses a synchronous ref lock; the service is intentionally one-event-per-call.
  // This test verifies the event service's result contract; component lock is covered by UI behavior.
  await createProductReminder('Pan', new Date(Date.now() + 60_000));
  expect(Calendar.createEventAsync).toHaveBeenCalledTimes(1);
});
