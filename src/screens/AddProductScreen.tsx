import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthenticatedStackParamList } from '../navigation/types';
import type { Product } from '../types/models';
import { getProducts, saveProducts } from '../storage/productStorage';
import { isProductNameValid, isQuantityValid } from '../utils/validation';

type Props = NativeStackScreenProps<AuthenticatedStackParamList, 'AltaProducto'>;

export default function AddProductScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  async function save() {
    if (saving.current) return;
    setError('');
    if (!isProductNameValid(name)) {
      setError('Ingresá el nombre del producto.');
      return;
    }
    const amount = Number(quantity);
    if (!isQuantityValid(amount)) {
      setError('La cantidad debe ser un número entero mayor o igual a 1.');
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const products = await getProducts();
      let id = Date.now().toString();
      while (products.some((product) => product.id === id)) {
        id = (Number(id) + 1).toString();
      }
      const product: Product = { id, name: name.trim(), quantity: amount, purchased: false };
      await saveProducts([...products, product]);
      navigation.goBack();
    } catch {
      setError('No se pudo guardar el producto. Intentá nuevamente.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Agregar producto</Text>
        <Text style={styles.subtitle}>Sumá lo que necesitás a tu lista.</Text>
        <Text style={styles.label}>Nombre del producto</Text>
        <TextInput accessibilityLabel="Nombre del producto" style={styles.input} value={name} onChangeText={setName} editable={!busy} />
        <Text style={styles.label}>Cantidad</Text>
        <TextInput accessibilityLabel="Cantidad" style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" editable={!busy} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} style={[styles.primaryButton, (busy) && styles.disabledButton]} onPress={save} disabled={busy}><Text style={styles.primaryButtonText}>{busy ? 'Guardando...' : 'Guardar producto'}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} style={[styles.linkButton, (busy) && styles.disabledButton]} onPress={() => navigation.goBack()} disabled={busy}><Text style={styles.linkButtonText}>Cancelar</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7FB' },
  content: { flexGrow: 1, padding: 24, paddingVertical: 32, gap: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#4B2E3F', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#7A5A6A', lineHeight: 22, marginBottom: 18 },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  brandTitle: { fontSize: 32, fontWeight: '700', color: '#B84D86', textAlign: 'center' },
  brandSubtitle: { fontSize: 15, color: '#7A5A6A', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  label: { color: '#4B2E3F', fontSize: 14, fontWeight: '600', marginTop: 6 },
  input: { backgroundColor: '#FFFFFF', color: '#4B2E3F', borderWidth: 1, borderColor: '#F1D7E6', borderRadius: 14, padding: 15, fontSize: 16, minHeight: 50 },
  error: { color: '#B84D86', fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: '#D86BA3', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center', minHeight: 48, marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: '#F0E6FF', borderColor: '#C8A2FF', borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', minHeight: 48 },
  secondaryButtonText: { color: '#4B2E3F', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  linkButton: { paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', minHeight: 48 },
  linkButtonText: { color: '#7A5A6A', fontSize: 15, textAlign: 'center' },
  disabledButton: { opacity: 0.5 },
});
