import type { ProductLocation } from '../types/models';

export function isProductLocationValid(value: unknown): value is ProductLocation {
  if (typeof value !== 'object' || value === null) return false;
  return 'latitude' in value && typeof value.latitude === 'number' && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
    'longitude' in value && typeof value.longitude === 'number' && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}
