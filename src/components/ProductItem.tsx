import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Product } from '../types/models';

type Props = {
  product: Product;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

export default function ProductItem({ product, onToggle, onDelete, disabled = false }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.name, product.purchased && styles.purchased]}>{product.name}</Text>
      <Text style={styles.secondary}>Cantidad: {product.quantity}</Text>
      <Text style={[styles.status, product.purchased && styles.successStatus]}>{product.purchased ? 'Comprado' : 'No comprado'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={product.purchased ? 'Marcar como pendiente' : 'Marcar como comprado'} accessibilityState={{ disabled }} disabled={disabled} style={[styles.button, disabled && styles.disabled]} onPress={() => onToggle(product.id)}>
          <Text style={styles.secondary}>{product.purchased ? 'Marcar como pendiente' : 'Marcar como comprado'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Eliminar" accessibilityState={{ disabled }} disabled={disabled} style={[styles.button, disabled && styles.disabled]} onPress={() => onDelete(product.id)}>
          <Text style={styles.delete}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, borderWidth: 1, borderColor: '#F1D7E6', backgroundColor: '#FFFFFF', borderRadius: 16, gap: 10, marginBottom: 14 },
  name: { fontSize: 19, fontWeight: '700', color: '#4B2E3F' },
  secondary: { fontSize: 14, color: '#7A5A6A' },
  purchased: { textDecorationLine: 'line-through', color: '#7A5A6A' },
  status: { alignSelf: 'flex-start', color: '#B84D86', backgroundColor: '#FBE7F1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, fontWeight: '600' },
  successStatus: { color: '#4B2E3F', backgroundColor: '#7ACB9A' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  button: { paddingVertical: 12, paddingHorizontal: 14, minHeight: 44, backgroundColor: '#FFF7FB', borderColor: '#F1D7E6', borderWidth: 1, borderRadius: 12 },
  disabled: { opacity: 0.5 },
  delete: { color: '#E86A7A', fontWeight: '600' },
});
