import { useEffect, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import type { ProductSupplier as Supplier } from '../types/models';
import { CONTACTS_UNAVAILABLE, selectSupplier } from '../contacts/selectSupplier';

type Props = { supplier?: Supplier; disabled?: boolean; onChange: (supplier?: Supplier) => Promise<void>; onBusy?: (busy: boolean) => void };

export default function ProductSupplier({ supplier, disabled, onChange, onBusy }: Props) {
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
      const next = remove ? undefined : await selectSupplier();
      if (next === null || !mounted.current) return;
      try { await onChange(next); }
      catch { throw new Error('No se pudo guardar el proveedor. El proveedor anterior se conserva. Intentá nuevamente.'); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'No se pudo asociar el proveedor. Intentá nuevamente.');
    } finally {
      inProgress.current = false;
      if (mounted.current) { setBusy(false); onBusy?.(false); }
    }
  }

  return <View style={{ gap: 8 }}>
    <Text style={{ color: '#7A5A6A' }}>{supplier ? `Proveedor: ${supplier.name}` : 'Sin proveedor asociado'}</Text>
    {supplier?.phone ? <Text style={{ color: '#7A5A6A' }}>Teléfono: {supplier.phone}</Text> : supplier?.email ? <Text style={{ color: '#7A5A6A' }}>Email: {supplier.email}</Text> : supplier ? <Text style={{ color: '#7A5A6A' }}>Sin teléfono ni email disponible</Text> : null}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={supplier ? 'Cambiar proveedor del producto' : 'Asociar proveedor al producto'} disabled={disabled || busy} accessibilityState={{ disabled: !!disabled || busy }} onPress={() => { void change(); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}>
        <Text style={{ color: '#7A5A6A' }}>{supplier ? 'Cambiar proveedor' : 'Asociar proveedor'}</Text>
      </TouchableOpacity>
      {supplier ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quitar proveedor del producto" disabled={disabled || busy} accessibilityState={{ disabled: !!disabled || busy }} onPress={() => { void change(true); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12 }}><Text style={{ color: '#7A5A6A' }}>Quitar proveedor</Text></TouchableOpacity> : null}
    </View>
    {Platform.OS === 'web' ? <Text style={{ color: '#7A5A6A' }}>{CONTACTS_UNAVAILABLE}</Text> : null}
    {busy ? <Text>Esperando permiso o selección de contacto. Podés cancelar desde la agenda.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: '#B84D86' }}>{error}</Text> : null}
  </View>;
}
