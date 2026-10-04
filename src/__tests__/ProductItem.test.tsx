import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ProductItem from '../components/ProductItem';
import type { Product } from '../types/models';

const product: Product = { id: '1', name: 'Leche', quantity: 2, purchased: false };

// The first native render can take longer when Jest runs without cache.
jest.setTimeout(15000);

describe('ProductItem', () => {
  it('muestra el nombre del producto, cantidad y estado', async () => {
    await render(<ProductItem product={product} onDelete={jest.fn()} onToggle={jest.fn()} />);
    expect(screen.getByText('Leche')).toBeTruthy();
    expect(screen.getByText('Cantidad: 2')).toBeTruthy();
    expect(screen.getByText('No comprado')).toBeTruthy();
  });

  it('ejecuta onDelete al presionar eliminar', async () => {
    const onDelete = jest.fn();
    await render(<ProductItem product={product} onDelete={onDelete} onToggle={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(product.id);
  });

  it('ejecuta onToggle al marcar como comprado', async () => {
    const onToggle = jest.fn();
    await render(<ProductItem product={product} onDelete={jest.fn()} onToggle={onToggle} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar como comprado' }));
    expect(onToggle).toHaveBeenCalledWith(product.id);
  });

  it('muestra comprado y permite marcar como pendiente', async () => {
    const onToggle = jest.fn();
    await render(<ProductItem product={{ ...product, purchased: true }} onDelete={jest.fn()} onToggle={onToggle} />);
    expect(screen.getByText('Comprado')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar como pendiente' }));
    expect(onToggle).toHaveBeenCalledWith(product.id);
  });
});
