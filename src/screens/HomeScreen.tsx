import { useCallback, useRef, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthenticatedStackParamList } from '../navigation/types';
import type { Session } from '../types/models';
import ProductItem from '../components/ProductItem';
import { useProductStore } from '../store/useProductStore';
import { deletePhoto } from '../storage/photoStorage';
import { REMINDER_DELAY_SECONDS, scheduleShoppingReminder } from '../notifications/reminders';
import ConfirmProductDelete from '../components/ConfirmProductDelete';
import type { Product } from '../types/models';

type Props = NativeStackScreenProps<AuthenticatedStackParamList, 'Home'> & {
  session: Session;
  onLogout: () => Promise<void>;
};

export default function HomeScreen({ navigation, session, onLogout }: Props) {
  const products = useProductStore((state) => state.products);
  const loading = useProductStore((state) => state.loading || !state.loaded && !state.loadError);
  const loadError = useProductStore((state) => state.loadError);
  const storeBusy = useProductStore((state) => state.busy);
  const load = useProductStore((state) => state.load);
  const toggle = useProductStore((state) => state.toggle);
  const remove = useProductStore((state) => state.remove);
  const [error, setError] = useState('');
  const [localBusy, setBusy] = useState(false);
  const busy = localBusy || storeBusy;
  const operationInProgress = useRef(false);
  const [retry, setRetry] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  useFocusEffect(useCallback(() => {
    setError('');
    void load().catch(() => undefined);
  }, [load, retry]));

  async function updateProducts(action: () => Promise<void>): Promise<boolean> {
    if (operationInProgress.current || loading || loadError) return false;
    operationInProgress.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      return true;
    } catch {
      setError('No se pudo guardar el cambio. Intentá nuevamente.');
      return false;
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }

  async function confirmDelete(product: Product) {
    const success = await updateProducts(async () => {
      await remove(product.id);
      if (product.photoUri) await deletePhoto(product.photoUri).catch(() => undefined);
      // The calendar event intentionally remains in the user's calendar.
    });
    if (success) setPendingDelete(null);
  }

  async function remind() {
    if (operationInProgress.current || loading || loadError) return;
    if (!products.some((product) => !product.purchased)) {
      Alert.alert('Lista al día', 'No hay productos pendientes para recordar.');
      return;
    }
    operationInProgress.current = true;
    setBusy(true);
    try {
      const identifier = await scheduleShoppingReminder();
      if (identifier === null) {
        Alert.alert('Permiso de notificaciones', 'No se otorgó permiso. Podés habilitar las notificaciones de Expo Go en los ajustes del dispositivo.');
        return;
      }
      Alert.alert('Recordatorio programado', `Te avisaremos en aproximadamente ${REMINDER_DELAY_SECONDS} segundos.`);
    } catch (error) {
      console.error("[ShoppingReminder] Error al programar:", error);
      Alert.alert('No se pudo programar', 'Ocurrió un error al programar el recordatorio. Intentá nuevamente.');
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }

  async function logout() {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setBusy(true);
    setError('');
    try {
      await onLogout();
    } catch {
      setError('No se pudo cerrar sesión. Intentá nuevamente.');
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi lista de compras</Text>
      <Text style={styles.secondary}>Usuario: {session.username}</Text>
      {loading ? <Text style={styles.secondary}>Cargando productos...</Text> : loadError ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>
          <Button color="#B84D86" title="Reintentar" onPress={() => setRetry((value) => value + 1)} />
        </View>
      ) : (
        <>
          <Text style={styles.summary}>{products.filter((product) => !product.purchased).length} productos pendientes</Text>
          <FlatList
            style={styles.list}
            data={products}
            keyExtractor={(product) => product.id}
            ListEmptyComponent={<Text style={styles.empty}>No hay productos en tu lista.</Text>}
            renderItem={({ item }) => (
              <ProductItem
                product={item}
                onOpen={(id) => navigation.navigate('DetalleProducto', { productId: id })}
                disabled={busy}
                onToggle={(id) => { void updateProducts(() => toggle(id)); }}
                onDelete={() => setPendingDelete(item)}
              />
            )}
          />
        </>
      )}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy || loading || !!loadError }} style={[styles.primaryButton, (busy || loading || !!loadError) && styles.disabledButton]} onPress={() => navigation.navigate('AltaProducto')} disabled={busy || loading || !!loadError}><Text style={styles.primaryButtonText}>Agregar producto</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy || loading || !!loadError }} style={[styles.secondaryButton, (busy || loading || !!loadError) && styles.disabledButton]} onPress={remind} disabled={busy || loading || !!loadError}><Text style={styles.secondaryButtonText}>Recordarme comprar</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} style={[styles.linkButton, (busy) && styles.disabledButton]} onPress={logout} disabled={busy}><Text style={styles.linkButtonText}>Cerrar sesión</Text></TouchableOpacity>
      <ConfirmProductDelete product={pendingDelete} busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={(product) => { void confirmDelete(product); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 24, gap: 12, backgroundColor: '#FFF7FB' },
  title: { fontSize: 27, fontWeight: '700', color: '#4B2E3F' },
  secondary: { fontSize: 14, color: '#7A5A6A', lineHeight: 20 },
  summary: { color: '#B84D86', backgroundColor: '#FBE7F1', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '600' },
  empty: { color: '#7A5A6A', textAlign: 'center', padding: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1D7E6', borderRadius: 16, lineHeight: 22 },
  list: { flex: 1 },
  error: { color: '#B84D86', fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: '#A84275', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center', minHeight: 48, marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: '#F0E6FF', borderColor: '#C8A2FF', borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', minHeight: 48 },
  secondaryButtonText: { color: '#4B2E3F', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  linkButton: { paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', minHeight: 48 },
  linkButtonText: { color: '#7A5A6A', fontSize: 15, textAlign: 'center' },
  disabledButton: { opacity: 0.5 },
});
