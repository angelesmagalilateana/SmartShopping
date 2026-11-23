import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProductStore } from '../store/useProductStore';
import type { AuthenticatedStackParamList } from '../navigation/types';
import ProductPhoto from '../components/ProductPhoto';
import ProductLocation from '../components/ProductLocation';
import ProductSupplier from '../components/ProductSupplier';
import ProductCalendarReminder from '../components/ProductCalendarReminder';

type Props = NativeStackScreenProps<AuthenticatedStackParamList, 'DetalleProducto'>;

export default function ProductDetailScreen({ route }: Props) {
  const product = useProductStore((state) => state.products.find((item) => item.id === route.params.productId));
  const load = useProductStore((state) => state.load);
  const loading = useProductStore((state) => state.loading || !state.loaded && !state.loadError);
  const loadError = useProductStore((state) => state.loadError);
  const update = useProductStore((state) => state.update);
  const [operationError, setOperationError] = useState('');
  useFocusEffect(useCallback(() => { void load().catch(() => undefined); }, [load]));

  if (loading) return <View style={styles.center}><Text style={styles.body}>Cargando producto...</Text></View>;
  if (loadError) return <View style={styles.center}><Text accessibilityRole="alert" style={styles.error}>{loadError}</Text><Text style={styles.body}>Volvé a la lista e intentá cargar nuevamente.</Text></View>;
  if (!product) return <View style={styles.center}><Text style={styles.body}>Este producto ya no está disponible.</Text></View>;

  async function save(action: () => Promise<void>) {
    setOperationError('');
    try { await action(); }
    catch (cause) { setOperationError('No se pudo guardar el cambio. El dato anterior se conserva; intentá nuevamente.'); throw cause; }
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>{product.name}</Text>
    <Text style={styles.body}>Cantidad: {product.quantity} · {product.purchased ? 'Comprado' : 'Pendiente'}</Text>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Foto</Text>
      <ProductPhoto reference={product.photoUri} onChange={(photoUri) => save(() => update(product.id, { photoUri }))} />
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Comercio y ubicación</Text>
      <ProductLocation location={product.location} onChange={(location) => save(() => update(product.id, { location }))} />
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Proveedor</Text>
      <ProductSupplier supplier={product.supplier} onChange={(supplier) => save(() => update(product.id, { supplier }))} />
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Calendario</Text>
      <ProductCalendarReminder productId={product.id} productName={product.name} event={product.calendarEvent} onChange={(calendarEvent) => save(() => update(product.id, { calendarEvent }))} />
    </View>
    {operationError ? <Text accessibilityRole="alert" style={styles.error}>{operationError}</Text> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: '#FFF7FB' },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#FFF7FB' },
  title: { fontSize: 26, fontWeight: '700', color: '#4B2E3F' },
  body: { fontSize: 15, lineHeight: 22, color: '#7A5A6A' },
  section: { padding: 16, gap: 12, borderWidth: 1, borderColor: '#F1D7E6', borderRadius: 16, backgroundColor: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#4B2E3F' },
  error: { color: '#8D3563', fontSize: 14, lineHeight: 20 },
});
