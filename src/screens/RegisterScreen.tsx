import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../navigation/types';
import { saveUser } from '../storage/authStorage';
import { isRequiredFieldValid } from '../utils/validation';

type Props = NativeStackScreenProps<PublicStackParamList, 'Registro'>;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function register() {
    if (busy) return;
    setError('');
    if (![username, password, confirmation].every(isRequiredFieldValid)) {
      setError('Completá todos los campos.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await saveUser({ username: username.trim(), password });
      Alert.alert('Registro exitoso', 'Ya podés iniciar sesión con tus datos.');
      navigation.popTo('Login');
    } catch {
      setError('No se pudo guardar el usuario. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Registro</Text>
        <Text style={styles.subtitle}>Creá tu cuenta para organizar tus compras.</Text>
        <Text style={styles.label}>Usuario</Text>
        <TextInput accessibilityLabel="Usuario" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} editable={!busy} />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput accessibilityLabel="Contraseña" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} />
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput accessibilityLabel="Confirmar contraseña" style={styles.input} value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} style={[styles.primaryButton, (busy) && styles.disabledButton]} onPress={register} disabled={busy}><Text style={styles.primaryButtonText}>{busy ? 'Guardando...' : 'Registrarse'}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} style={[styles.linkButton, (busy) && styles.disabledButton]} onPress={() => navigation.popTo('Login')} disabled={busy}><Text style={styles.linkButtonText}>Volver al Login</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7FB' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 32, gap: 14 },
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
