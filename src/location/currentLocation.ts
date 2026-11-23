import * as Location from 'expo-location';
import { isProductLocationValid } from '../utils/productLocation';
import type { ProductLocation } from '../types/models';

export const LOCATION_TIMEOUT_MS = 20000;
class LocationError extends Error {}

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new LocationError('La ubicación tardó demasiado. Intentá nuevamente en un lugar con mejor señal.')), LOCATION_TIMEOUT_MS);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

export async function getCommerceLocation(): Promise<ProductLocation> {
  try {
    const permission = await withTimeout(Location.requestForegroundPermissionsAsync());
    if (!permission.granted) throw new LocationError(permission.canAskAgain
      ? 'Permiso de ubicación denegado. Permití el acceso en la app o en los ajustes del sitio para asociar el comercio y reintentá.'
      : 'Permiso de ubicación bloqueado. Habilitalo en los ajustes de la app o del navegador y reintentá.');
    if (!await withTimeout(Location.hasServicesEnabledAsync())) throw new LocationError('La ubicación está desactivada. Activala en el dispositivo y reintentá.');
    // Expo web forwards maximumAge and timeout to browser geolocation.
    const options = { accuracy: Location.Accuracy.Balanced, maximumAge: 0, timeout: LOCATION_TIMEOUT_MS };
    const result = await withTimeout(Location.getCurrentPositionAsync(options));
    const coordinates = { latitude: result.coords.latitude, longitude: result.coords.longitude };
    if (!isProductLocationValid(coordinates)) throw new LocationError('No se recibieron coordenadas válidas. Intentá nuevamente.');
    return coordinates;
  } catch (cause) {
    if (cause instanceof LocationError) throw cause;
    throw new Error('No se pudo obtener la ubicación. Revisá los permisos y la señal. En web usá HTTPS o localhost y un navegador con geolocalización.');
  }
}
