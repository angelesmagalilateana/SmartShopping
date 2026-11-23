import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { pickPhoto } from '../photos/pickPhoto';
import { deletePhoto, releasePhoto, resolvePhoto, savePhoto } from '../storage/photoStorage';

type Props = { reference?: string; disabled?: boolean; onChange: (reference?: string) => Promise<void>; onBusy?: (busy: boolean) => void };

export default function ProductPhoto({ reference, disabled, onChange, onBusy }: Props) {
  const [uri, setUri] = useState<string>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const activeOperation = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    let active = true;
    let resolved: string | undefined;
    setUri(undefined);
    setError('');
    if (reference) void resolvePhoto(reference).then((value) => {
      resolved = value;
      if (active) setUri(value); else releasePhoto(value);
    }).catch((cause: Error) => { if (active) setError(cause.message); });
    return () => { active = false; if (resolved) releasePhoto(resolved); };
  }, [reference]);

  async function change(source?: 'camera' | 'library') {
    if (disabled || activeOperation.current) return;
    activeOperation.current = true;
    setBusy(true);
    onBusy?.(true);
    setError('');
    let created: string | undefined;
    try {
      if (source) {
        const asset = await pickPhoto(source);
        if (!asset) return;
        created = await savePhoto(asset);
      }
      if (!mounted.current) {
        if (created) await deletePhoto(created).catch(() => undefined);
        return;
      }
      await onChange(created);
      // Delete the previous file only after the new reference has been saved.
      if (reference) await deletePhoto(reference).catch(() => undefined);
    } catch (cause) {
      if (created) await deletePhoto(created).catch(() => undefined);
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la foto. Intentá nuevamente.');
    } finally {
      activeOperation.current = false;
      setBusy(false);
      onBusy?.(false);
    }
  }

  return <View style={{ gap: 8 }}>
    {uri ? <Image accessibilityLabel="Foto del producto" source={{ uri }} style={{ width: 88, height: 88, borderRadius: 12 }} onError={() => setError('No se pudo mostrar la foto. Podés reemplazarla.')} /> : null}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {(['camera', 'library', ...(reference ? ['remove'] : [])] as const).map((source) => <TouchableOpacity key={source} accessibilityRole="button" disabled={disabled || busy} accessibilityState={{ disabled: !!disabled || busy }} onPress={() => { void change(source === 'remove' ? undefined : source as 'camera' | 'library'); }} style={{ padding: 12, minHeight: 44, backgroundColor: '#FFF7FB', borderRadius: 12, opacity: disabled || busy ? 0.5 : 1 }}>
        <Text style={{ color: '#7A5A6A' }}>{source === 'camera' ? 'Tomar foto' : source === 'library' ? 'Elegir de galería' : 'Quitar foto'}</Text>
      </TouchableOpacity>)}
    </View>
    {Platform.OS === 'web' ? <Text style={{ color: '#7A5A6A' }}>La captura depende del navegador y del dispositivo. Si no está disponible, elegí una foto de la galería.</Text> : null}
    {busy ? <Text>Procesando foto...</Text> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: '#B84D86' }}>{error}</Text> : null}
  </View>;
}
