import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { releasePhoto, resolvePhoto } from '../storage/photoStorage';

export default function ProductPhotoPreview({ reference }: { reference?: string }) {
  const [uri, setUri] = useState<string>();
  useEffect(() => {
    let active = true;
    let resolved: string | undefined;
    setUri(undefined);
    if (reference) void resolvePhoto(reference).then((value) => {
      resolved = value;
      if (active) setUri(value); else releasePhoto(value);
    }).catch(() => { if (active) setUri(undefined); });
    return () => { active = false; if (resolved) releasePhoto(resolved); };
  }, [reference]);
  if (!reference) return <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#FBE7F1' }} />;
  return uri
    ? <Image accessibilityLabel="Foto del producto" source={{ uri }} style={{ width: 56, height: 56, borderRadius: 12 }} />
    : <Text accessibilityLabel="Cargando foto del producto" style={{ width: 56, height: 56, textAlignVertical: 'center', textAlign: 'center', color: '#7A5A6A' }}>…</Text>;
}
