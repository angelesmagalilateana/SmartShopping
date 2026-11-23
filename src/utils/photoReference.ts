export function isPhotoReferenceValid(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string' && /^(file:\/\/\/.+|photo:[a-zA-Z0-9-]+)$/.test(value);
}
