import { Platform } from 'react-native';
import type { ProductSupplier } from '../types/models';

export const CONTACTS_UNAVAILABLE = 'La agenda de contactos no está disponible en esta plataforma. Usá la app en Android para asociar un proveedor.';
class SupplierError extends Error {}

export async function selectSupplier(): Promise<ProductSupplier | null> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new SupplierError(CONTACTS_UNAVAILABLE);
  try {
    // Load only after the platform check; Metro and Jest both support require.
    const Contacts: typeof import('expo-contacts') = require('expo-contacts');
    if (typeof Contacts.Contact?.presentPicker !== 'function') throw new SupplierError(CONTACTS_UNAVAILABLE);
    let permission = await Contacts.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) permission = await Contacts.requestPermissionsAsync();
    if (!permission.granted) throw new SupplierError(permission.canAskAgain
      ? 'Permiso de contactos denegado. Permití el acceso para seleccionar un proveedor e intentá nuevamente.'
      : 'Permiso de contactos bloqueado. Habilitalo en los ajustes de la app y volvé a intentar.');
    const selected = await Contacts.Contact.presentPicker();
    if (!selected) return null;
    const details = await selected.getDetails([Contacts.ContactField.FULL_NAME, Contacts.ContactField.PHONES, Contacts.ContactField.EMAILS] as const);
    const name = details.fullName?.trim() || 'Contacto sin nombre';
    const phone = details.phones?.find((item) => item.number?.trim())?.number?.trim();
    const email = details.emails?.find((item) => item.address?.trim())?.address?.trim();
    // Persist only the chosen contact's display name and one useful contact detail.
    return { name, ...(phone ? { phone } : email ? { email } : {}) };
  } catch (cause) {
    if (cause instanceof SupplierError) throw cause;
    throw new Error('No se pudo abrir la agenda o leer el contacto seleccionado. Verificá que Contactos esté disponible y volvé a intentar.');
  }
}
