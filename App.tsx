import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getSession, getUser, removeSession } from './src/storage/authStorage';
import type { Session } from './src/types/models';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function restoreSession() {
    setLoading(true);
    setError('');
    try {
      const savedSession = await getSession();
      if (savedSession) {
        const user = await getUser();
        if (user && user.username === savedSession.username) {
          setSession(savedSession);
        } else {
          await removeSession();
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
      setError('No se pudo recuperar la sesión.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void restoreSession();
  }, []);

  async function logout() {
    await removeSession();
    setSession(null);
  }

  return (
    <>
      <StatusBar style="auto" />
      {loading || error ? (
        <View style={styles.container}>
          <Text>{loading ? 'Cargando sesión...' : error}</Text>
          {!loading && error ? <Button title="Reintentar" onPress={restoreSession} /> : null}
        </View>
      ) : (
        <AppNavigator session={session} onLogin={setSession} onLogout={logout} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
});
