import type { ProductSupplier } from '../types/models';

export function isProductSupplierValid(value: unknown): value is ProductSupplier {
  if (typeof value !== 'object' || value === null || !('name' in value) || typeof value.name !== 'string' || !value.name.trim()) return false;
  return Object.keys(value).every((key) => ['name', 'phone', 'email'].includes(key)) &&
    (!('phone' in value) || value.phone === undefined || typeof value.phone === 'string' && !!value.phone.trim()) &&
    (!('email' in value) || value.email === undefined || typeof value.email === 'string' && !!value.email.trim());
}
