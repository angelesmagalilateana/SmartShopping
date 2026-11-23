import type { ProductCalendarEvent } from '../types/models';
import { createProductReminder } from './createProductReminder';

const pendingByProduct = new Map<string, ProductCalendarEvent>();
const inFlightByProduct = new Map<string, Promise<ProductCalendarEvent>>();

export function getPendingCalendarEvent(productId: string): ProductCalendarEvent | undefined {
  return pendingByProduct.get(productId);
}

export function clearPendingCalendarEvent(productId: string): void {
  pendingByProduct.delete(productId);
}

export async function createOrRetryProductReminder(
  productId: string,
  productName: string,
  startDate: Date,
  linkEvent: (event: ProductCalendarEvent) => Promise<void>,
): Promise<ProductCalendarEvent> {
  const current = inFlightByProduct.get(productId);
  if (current) return current;

  const operation = (async () => {
    const pending = pendingByProduct.get(productId);
    const event = pending ?? await createProductReminder(productName, startDate);
    if (!pending) pendingByProduct.set(productId, event);
    await linkEvent(event);
    pendingByProduct.delete(productId);
    return event;
  })();

  inFlightByProduct.set(productId, operation);
  try {
    return await operation;
  } finally {
    if (inFlightByProduct.get(productId) === operation) inFlightByProduct.delete(productId);
  }
}
