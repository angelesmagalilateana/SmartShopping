import { useEffect, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { ProductCalendarEvent } from '../types/models';
import { CALENDAR_UNAVAILABLE } from '../calendar/createProductReminder';
import { clearPendingCalendarEvent, createOrRetryProductReminder, getPendingCalendarEvent } from '../calendar/pendingEventLinks';
import { beginCalendarAction } from '../calendar/actionLock';

type Props = { productId: string; productName: string; event?: ProductCalendarEvent; disabled?: boolean; onChange: (event?: ProductCalendarEvent) => Promise<void>; onBusy?: (busy: boolean) => void };

export default function ProductCalendarReminder({ productId, productName, event, disabled, onChange, onBusy }: Props) {
  const [date, setDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [picker, setPicker] = useState<'date' | 'time' | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingEvent, setPendingEvent] = useState(() => getPendingCalendarEvent(productId));
  const active = useRef(false);

  useEffect(() => { setPendingEvent(getPendingCalendarEvent(productId)); }, [productId]);
  useEffect(() => {
    if (event && pendingEvent?.eventId === event.eventId) {
      clearPendingCalendarEvent(productId);
      setPendingEvent(undefined);
    }
  }, [event?.eventId, pendingEvent?.eventId, productId]);

  async function create() {
    if (disabled || busy || event || !beginCalendarAction(active)) return;
    setBusy(true);
    onBusy?.(true);
    setError('');
    try {
      await createOrRetryProductReminder(productId, productName, date, onChange);
      setPendingEvent(undefined);
    } catch (cause) {
      setPendingEvent(getPendingCalendarEvent(productId));
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el recordatorio. Intentá nuevamente.');
    } finally {
      active.current = false;
      setBusy(false);
      onBusy?.(false);
    }
  }

  function onPickerChange(_event: DateTimePickerEvent, selected?: Date) {
    setPicker(undefined);
    if (selected) setDate(selected);
  }

  return <View style={{ gap: 8 }}>
    {event ? <Text style={{ color: '#7A5A6A' }}>Recordatorio: {new Date(event.startDate).toLocaleString()} (evento vinculado)</Text> : <Text style={{ color: '#7A5A6A' }}>Sin recordatorio de calendario</Text>}
    {Platform.OS === 'web' ? <Text style={{ color: '#7A5A6A' }}>{CALENDAR_UNAVAILABLE}</Text> : <>
      {!event && !pendingEvent ? <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Elegir fecha del recordatorio" accessibilityState={{ disabled: !!disabled || busy }} disabled={disabled || busy} onPress={() => setPicker('date')} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}><Text>Elegir fecha</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Elegir hora del recordatorio" accessibilityState={{ disabled: !!disabled || busy }} disabled={disabled || busy} onPress={() => setPicker('time')} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}><Text>Elegir hora</Text></TouchableOpacity>
        </View>
        <Text style={{ color: '#7A5A6A' }}>Fecha y hora seleccionadas: {date.toLocaleString()}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Crear recordatorio para ${productName}`} accessibilityState={{ disabled: !!disabled || busy }} disabled={disabled || busy} onPress={() => { void create(); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#F0E6FF', borderRadius: 12 }}><Text>{busy ? 'Creando recordatorio...' : 'Crear recordatorio'}</Text></TouchableOpacity>
      </> : pendingEvent ? <View style={{ gap: 8 }}>
        <Text accessibilityRole="alert" style={{ color: '#7A5A6A' }}>El evento {pendingEvent.eventId} ya se creó, pero falta vincularlo al producto. Reintentá el vínculo para evitar crear otro evento.</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Reintentar vínculo del evento existente" accessibilityState={{ disabled: !!disabled || busy }} disabled={disabled || busy} onPress={() => { void create(); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#F0E6FF', borderRadius: 12 }}><Text>{busy ? 'Vinculando evento...' : 'Reintentar vínculo'}</Text></TouchableOpacity>
      </View> : <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quitar vínculo al evento sin borrarlo del calendario" accessibilityState={{ disabled: !!disabled || busy }} disabled={disabled || busy} onPress={() => { void onChange(undefined).catch(() => setError('No se pudo quitar el vínculo al evento. El evento sigue en el calendario.')); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}><Text>Quitar vínculo al evento</Text></TouchableOpacity>}
      {picker ? <DateTimePicker value={date} mode={picker} display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={picker === 'date' ? new Date() : undefined} onChange={onPickerChange} /> : null}
    </>}
    {error ? <Text accessibilityRole="alert" style={{ color: '#B84D86' }}>{error}</Text> : null}
  </View>;
}
