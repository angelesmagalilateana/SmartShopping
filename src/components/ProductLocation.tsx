import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ProductLocation as Coordinates } from '../types/models';
import { getCommerceLocation } from '../location/currentLocation';

type Props = { location?: Coordinates; disabled?: boolean; onChange: (location?: Coordinates) => Promise<void>; onBusy?: (busy: boolean) => void };

export default function ProductLocation({ location, disabled, onChange, onBusy }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inProgress = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function change(remove = false) {
    if (disabled || inProgress.current) return;
    inProgress.current = true;
    setBusy(true);
    onBusy?.(true);
    setError('');
    try {
      const next = remove ? undefined : await getCommerceLocation();
      if (!mounted.current) return;
      try { await onChange(next); }
      catch { throw new Error('No se pudo guardar la ubicación. La ubicación anterior se conserva. Intentá nuevamente.'); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'No se pudo obtener la ubicación. Intentá nuevamente.');
    } finally {
      inProgress.current = false;
      if (mounted.current) { setBusy(false); onBusy?.(false); }
    }
  }

  return <View style={{ gap: 8 }}>
    <Text style={{ color: '#7A5A6A' }}>{location
      ? `Ubicación del comercio: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      : 'Sin ubicación del comercio. Usá esta opción cuando estés en el comercio.'}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={location ? 'Actualizar ubicación del comercio' : 'Asociar ubicación actual del comercio'} disabled={disabled || busy} accessibilityState={{ disabled: !!disabled || busy }} onPress={() => { void change(); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}>
        <Text style={{ color: '#7A5A6A' }}>{location ? 'Actualizar ubicación' : 'Asociar ubicación actual'}</Text>
      </TouchableOpacity>
      {location ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quitar ubicación del comercio" disabled={disabled || busy} accessibilityState={{ disabled: !!disabled || busy }} onPress={() => { void change(true); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}><Text style={{ color: '#7A5A6A' }}>Quitar ubicación</Text></TouchableOpacity> : null}
    </View>
    {busy ? <Text>Procesando ubicación; si aparece una solicitud de permiso, respondela para continuar...</Text> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: '#B84D86' }}>{error}</Text> : null}
  </View>;
}
