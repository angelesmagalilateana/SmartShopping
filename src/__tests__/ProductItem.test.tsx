import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ProductItem from '../components/ProductItem';
import type { Product } from '../types/models';

const product: Product = { id: '1', name: 'Leche', quantity: 2, purchased: false };

// The first native render can take longer when Jest runs without cache.
jest.setTimeout(15000);

describe('ProductItem', () => {
  it('muestra el nombre del producto, cantidad y estado', async () => {
    await render(<ProductItem product={product} onOpen={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />);
    expect(screen.getByText('Leche')).toBeTruthy();
    expect(screen.getByText(/Cantidad: 2.*Pendiente/)).toBeTruthy();
  });

  it('ejecuta onDelete al presionar eliminar', async () => {
    const onDelete = jest.fn();
    await render(<ProductItem product={product} onOpen={jest.fn()} onDelete={onDelete} onToggle={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar Leche' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(product.id);
  });

  it('ejecuta onToggle al marcar como comprado', async () => {
    const onToggle = jest.fn();
    await render(<ProductItem product={product} onOpen={jest.fn()} onDelete={jest.fn()} onToggle={onToggle} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar Leche como comprado' }));
    expect(onToggle).toHaveBeenCalledWith(product.id);
  });

  it('muestra comprado y permite marcar como pendiente', async () => {
    const onToggle = jest.fn();
    await render(<ProductItem product={{ ...product, purchased: true }} onOpen={jest.fn()} onDelete={jest.fn()} onToggle={onToggle} />);
    expect(screen.getByText(/Cantidad: 2.*Comprado/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar Leche como pendiente' }));
    expect(onToggle).toHaveBeenCalledWith(product.id);
  });

  it('abre el detalle y mantiene la lista sin botones de funciones avanzadas', async () => {
    const onOpen = jest.fn();
    await render(<ProductItem product={{ ...product, location: { latitude: 1, longitude: 2 }, supplier: { name: 'Ana' }, calendarEvent: { eventId: 'e1', calendarId: 'c1', startDate: '2027-01-01T10:00:00.000Z' } }} onOpen={onOpen} onDelete={jest.fn()} onToggle={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ver detalle de Leche' }));
    expect(onOpen).toHaveBeenCalledWith('1');
    expect(screen.getByLabelText('Datos asociados: Ubicación, Proveedor, Recordatorio')).toBeTruthy();
    expect(screen.queryByText('Elegir hora')).toBeNull();
    expect(screen.getByRole('button', { name: 'Eliminar Leche' })).toBeTruthy();
  });

  it('muestra producto sin adjuntos y acciones accesibles', async () => {
    await render(<ProductItem product={product} onOpen={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Ver detalle de Leche' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Marcar Leche como comprado' })).toBeTruthy();
    expect(screen.queryByLabelText(/Datos asociados/)).toBeNull();
  });
});
