import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import type { ProductCalendarEvent } from '../types/models';

export const CALENDAR_UNAVAILABLE = 'Los recordatorios de calendario requieren la app Android o iOS instalada. En web podés crear un evento manualmente.';

export async function createProductReminder(productName: string, startDate: Date): Promise<ProductCalendarEvent> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new Error(CALENDAR_UNAVAILABLE);
  if (!Number.isFinite(startDate.getTime()) || startDate.getTime() <= Date.now()) throw new Error('Elegí una fecha y hora futura.');
  try {
    let permission = await Calendar.getCalendarPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) permission = await Calendar.requestCalendarPermissionsAsync();
    if (!permission.granted) throw new Error(permission.canAskAgain
      ? 'Permiso de calendario denegado. Permití el acceso para crear el recordatorio e intentá nuevamente.'
      : 'Permiso de calendario bloqueado. Habilitá el acceso en los ajustes de la app y volvé a intentar.');

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((calendar) => calendar.allowsModifications && calendar.entityType === Calendar.EntityTypes.EVENT);
    if (!writable) throw new Error('No hay calendarios de eventos editables disponibles. Agregá o habilitá un calendario en el dispositivo y reintentá.');

    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const eventId = await Calendar.createEventAsync(writable.id, {
      title: `Recordatorio: ${productName}`,
      notes: `Es hora de comprar ${productName}. Recordatorio creado desde SmartShopping.`,
      startDate,
      endDate,
      alarms: [{ relativeOffset: 0 }],
    });
    if (!eventId) throw new Error('El calendario no confirmó la creación del evento.');
    return { eventId, calendarId: writable.id, startDate: startDate.toISOString() };
  } catch (cause) {
    if (cause instanceof Error && /Permiso|calendarios|confirmó|Elegí/.test(cause.message)) throw cause;
    throw new Error('No se pudo crear el evento en el calendario. Revisá los permisos y la disponibilidad del calendario e intentá nuevamente.');
  }
}
