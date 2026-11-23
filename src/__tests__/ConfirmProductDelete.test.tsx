import { fireEvent, render, screen } from '@testing-library/react-native';
import { expect, it, jest } from '@jest/globals';
import ConfirmProductDelete from '../components/ConfirmProductDelete';
import type { Product } from '../types/models';

jest.setTimeout(20000);

const product: Product = { id: 'p1', name: 'Leche', quantity: 1, purchased: false };

it('confirma eliminación y advierte que el evento personal permanece', async () => {
  const onConfirm = jest.fn();
  await render(<ConfirmProductDelete product={{ ...product, calendarEvent: { eventId: 'ev1', calendarId: 'cal1', startDate: '2027-01-01T10:00:00.000Z' } }} onCancel={jest.fn()} onConfirm={onConfirm} />);
  expect(screen.getByText(/seguirá en la agenda/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirmar eliminación de Leche' }));
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
});

it('permite cancelar sin invocar la eliminación y explica el caso sin evento', async () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  await render(<ConfirmProductDelete product={product} onCancel={onCancel} onConfirm={onConfirm} />);
  expect(screen.queryByText(/seguirá en la agenda/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancelar eliminación' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});
