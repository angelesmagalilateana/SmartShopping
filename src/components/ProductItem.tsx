import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Product } from '../types/models';
import ProductPhotoPreview from './ProductPhotoPreview';

type Props = {
  product: Product;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

export default function ProductItem({ product, onOpen, onToggle, onDelete, disabled = false }: Props) {
  const indicators = [
    product.location ? 'Ubicación' : undefined,
    product.supplier ? 'Proveedor' : undefined,
    product.calendarEvent ? 'Recordatorio' : undefined,
  ].filter(Boolean);
  return (
    <View style={styles.card}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver detalle de ${product.name}`} accessibilityHint="Abre la foto y las funciones avanzadas del producto" disabled={disabled} onPress={() => onOpen(product.id)} style={styles.details}>
        <ProductPhotoPreview reference={product.photoUri} />
        <View style={styles.info}>
          <Text style={[styles.name, product.purchased && styles.purchased]} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.secondary}>Cantidad: {product.quantity} · {product.purchased ? 'Comprado' : 'Pendiente'}</Text>
          {indicators.length > 0 ? <Text accessibilityLabel={`Datos asociados: ${indicators.join(', ')}`} style={styles.indicators}>{indicators.join(' · ')}</Text> : null}
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={product.purchased ? `Marcar ${product.name} como pendiente` : `Marcar ${product.name} como comprado`} accessibilityState={{ disabled }} disabled={disabled} style={styles.quickButton} onPress={() => onToggle(product.id)}>
          <Text style={styles.quickButtonText}>{product.purchased ? 'Pendiente' : 'Comprado'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Eliminar ${product.name}`} accessibilityState={{ disabled }} disabled={disabled} style={styles.deleteButton} onPress={() => onDelete(product.id)}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderWidth: 1, borderColor: '#F1D7E6', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10, gap: 10 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 17, fontWeight: '700', color: '#4B2E3F' },
  secondary: { fontSize: 14, color: '#7A5A6A' },
  indicators: { fontSize: 12, color: '#7A5A6A' },
  purchased: { textDecorationLine: 'line-through', color: '#7A5A6A' },
  actions: { flexDirection: 'row', gap: 8 },
  quickButton: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, minHeight: 44, backgroundColor: '#F0E6FF', borderRadius: 12 },
  quickButtonText: { color: '#4B2E3F', fontSize: 14, fontWeight: '600' },
  deleteButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#A84275' },
  deleteText: { color: '#8D3563', fontSize: 14, fontWeight: '600' },
});
