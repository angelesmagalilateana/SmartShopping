import { beforeEach, expect, it, jest } from '@jest/globals';
import { createProductReminder } from '../calendar/createProductReminder';
import { clearPendingCalendarEvent, createOrRetryProductReminder, getPendingCalendarEvent } from '../calendar/pendingEventLinks';
import type { ProductCalendarEvent } from '../types/models';

jest.mock('../calendar/createProductReminder', () => ({ createProductReminder: jest.fn() }));

const created: ProductCalendarEvent = { eventId: 'event-1', calendarId: 'calendar-1', startDate: '2027-01-01T10:00:00.000Z' };

beforeEach(() => {
  clearPendingCalendarEvent('product-1');
  jest.clearAllMocks();
  jest.mocked(createProductReminder).mockResolvedValue(created);
});

it('retiene ID y metadatos tras fallo del vínculo y reusa el mismo evento al reintentar', async () => {
  const failedLink = jest.fn< (event: ProductCalendarEvent) => Promise<void> >().mockRejectedValue(new Error('AsyncStorage no disponible'));
  await expect(createOrRetryProductReminder('product-1', 'Leche', new Date(created.startDate), failedLink)).rejects.toThrow('AsyncStorage');
  expect(getPendingCalendarEvent('product-1')).toEqual(created);

  const retryLink = jest.fn<(event: ProductCalendarEvent) => Promise<void>>().mockResolvedValue(undefined);
  await createOrRetryProductReminder('product-1', 'Leche', new Date(created.startDate), retryLink);
  expect(retryLink).toHaveBeenCalledWith(created);
  expect(createProductReminder).toHaveBeenCalledTimes(1);
  expect(getPendingCalendarEvent('product-1')).toBeUndefined();
});

it('coalesce intentos concurrentes del mismo producto para no duplicar el evento', async () => {
  let finishCreate!: (value: ProductCalendarEvent) => void;
  jest.mocked(createProductReminder).mockImplementationOnce(() => new Promise((resolve) => { finishCreate = resolve; }));
  let finishLink!: () => void;
  const link = jest.fn< (event: ProductCalendarEvent) => Promise<void> >(() => new Promise((resolve) => { finishLink = resolve; }));

  const first = createOrRetryProductReminder('product-1', 'Leche', new Date(created.startDate), link);
  const second = createOrRetryProductReminder('product-1', 'Leche', new Date(created.startDate), link);
  finishCreate(created);
  await Promise.resolve();
  expect(createProductReminder).toHaveBeenCalledTimes(1);
  expect(link).toHaveBeenCalledTimes(1);
  finishLink();
  await expect(Promise.all([first, second])).resolves.toEqual([created, created]);
});
