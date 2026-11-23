import { expect, it } from '@jest/globals';
import { beginCalendarAction } from '../calendar/actionLock';

it('bloquea una segunda acción mientras el primer recordatorio sigue en curso', () => {
  const lock = { current: false };
  expect(beginCalendarAction(lock)).toBe(true);
  expect(beginCalendarAction(lock)).toBe(false);
  lock.current = false;
  expect(beginCalendarAction(lock)).toBe(true);
});
