import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Product } from '../types/models';

type Props = { product: Product | null; busy?: boolean; onCancel: () => void; onConfirm: (product: Product) => void };

export default function ConfirmProductDelete({ product, busy = false, onCancel, onConfirm }: Props) {
  return <Modal visible={!!product} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.scrim}>
      <View accessibilityViewIsModal style={styles.dialog}>
        <Text accessibilityRole="header" style={styles.title}>¿Eliminar {product?.name}?</Text>
        <Text style={styles.body}>El producto y sus datos asociados se quitarán de la lista.</Text>
        {product?.calendarEvent ? <Text style={styles.warning}>El evento del calendario seguirá en la agenda. Esta acción no modifica ni elimina eventos personales.</Text> : null}
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancelar eliminación" disabled={busy} onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Confirmar eliminación de ${product?.name ?? 'producto'}`} accessibilityState={{ disabled: busy }} disabled={busy || !product} onPress={() => { if (product) onConfirm(product); }} style={styles.confirm}><Text style={styles.confirmText}>{busy ? 'Eliminando...' : 'Eliminar producto'}</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(40, 24, 34, 0.55)' },
  dialog: { padding: 20, gap: 12, borderRadius: 18, backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: '700', color: '#4B2E3F' },
  body: { fontSize: 15, lineHeight: 22, color: '#4B2E3F' },
  warning: { padding: 12, borderRadius: 10, backgroundColor: '#FFF1D6', color: '#5A3B00', fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  cancel: { justifyContent: 'center', paddingHorizontal: 14, minHeight: 44, borderRadius: 12, backgroundColor: '#F0E6FF' },
  cancelText: { color: '#4B2E3F', fontWeight: '600' },
  confirm: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, minHeight: 44, borderRadius: 12, backgroundColor: '#A84275' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
