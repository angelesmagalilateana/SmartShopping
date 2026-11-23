import type { ImagePickerAsset } from 'expo-image-picker';

async function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') throw new Error('Este navegador no permite guardar fotos. Probá con otro navegador.');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('smartshopping-photos', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento de fotos.'));
    request.onblocked = () => reject(new Error('Cerrá otras pestañas de SmartShopping y reintentá.'));
  });
}

async function access<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', mode);
    const request = action(transaction.objectStore('photos'));
    transaction.oncomplete = () => { db.close(); resolve(request.result); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(new Error('No se pudo guardar o leer la foto. Revisá el espacio disponible.')); };
  });
}

export async function savePhoto(asset: ImagePickerAsset): Promise<string> {
  const blob = asset.file ?? await (await fetch(asset.uri)).blob();
  const reference = `photo:${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await access('readwrite', (store) => store.put(blob, reference));
  return reference;
}

export async function resolvePhoto(reference: string): Promise<string> {
  const blob = await access<Blob | undefined>('readonly', (store) => store.get(reference));
  if (!blob) throw new Error('La foto guardada ya no está disponible. Podés reemplazarla.');
  return URL.createObjectURL(blob);
}

export function releasePhoto(uri: string) { URL.revokeObjectURL(uri); }
export async function deletePhoto(reference: string): Promise<void> {
  await access('readwrite', (store) => store.delete(reference));
}
