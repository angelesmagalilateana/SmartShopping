import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

export async function savePhoto(asset: ImagePickerAsset): Promise<string> {
  const directory = new Directory(Paths.document, 'product-photos');
  directory.create({ idempotent: true, intermediates: true });
  const extension = asset.uri.split('?')[0].match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  new File(asset.uri).copy(destination);
  return destination.uri;
}

export async function resolvePhoto(reference: string): Promise<string> {
  if (!new File(reference).exists) throw new Error('La foto guardada ya no está disponible. Podés reemplazarla.');
  return reference;
}

export function releasePhoto(_uri: string) {}

export async function deletePhoto(reference: string): Promise<void> {
  const directory = new Directory(Paths.document, 'product-photos');
  if (!reference.startsWith(`${directory.uri.replace(/\/$/, '')}/`)) return;
  const file = new File(reference);
  if (file.exists) file.delete();
}
