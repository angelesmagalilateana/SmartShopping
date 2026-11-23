import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ProductSupplier from '../components/ProductSupplier';
import { selectSupplier } from '../contacts/selectSupplier';
import type { ProductSupplier as Supplier } from '../types/models';
jest.mock('../contacts/selectSupplier', () => ({ selectSupplier: jest.fn(), CONTACTS_UNAVAILABLE: 'Agenda no disponible' }));
jest.setTimeout(30000);
const supplier = { name: 'Ana', phone: '123' };
beforeEach(() => { jest.resetAllMocks(); });
it('muestra el proveedor sin pedir permiso al renderizar', async () => {
  await render(<ProductSupplier supplier={supplier} onChange={async () => {}} />);
  expect(screen.getByText('Proveedor: Ana')).toBeTruthy();
  expect(screen.getByText('Teléfono: 123')).toBeTruthy();
  expect(selectSupplier).not.toHaveBeenCalled();
});
it('asocia el seleccionado al pulsar el botón', async () => {
  jest.mocked(selectSupplier).mockResolvedValue(supplier);
  const change = jest.fn<(value?: Supplier) => Promise<void>>().mockResolvedValue(undefined);
  await render(<ProductSupplier onChange={change} />);
  await fireEvent.press(screen.getByText('Asociar proveedor'));
  expect(change).toHaveBeenCalledWith(supplier);
});
it('cancelar conserva el proveedor anterior', async () => {
  jest.mocked(selectSupplier).mockResolvedValue(null);
  const change = jest.fn<(value?: Supplier) => Promise<void>>();
  await render(<ProductSupplier supplier={supplier} onChange={change} />);
  await fireEvent.press(screen.getByText('Cambiar proveedor'));
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByText('Proveedor: Ana')).toBeTruthy();
});
it('quitar no abre la agenda y comunica errores de persistencia', async () => {
  const change = jest.fn<(value?: Supplier) => Promise<void>>().mockRejectedValue(new Error('disco'));
  await render(<ProductSupplier supplier={supplier} onChange={change} />);
  await fireEvent.press(screen.getByText('Quitar proveedor'));
  expect(change).toHaveBeenCalledWith(undefined);
  expect(selectSupplier).not.toHaveBeenCalled();
  expect(screen.getByText(/El proveedor anterior se conserva/)).toBeTruthy();
});
it('permite reintentar después de un rechazo de permisos', async () => {
  jest.mocked(selectSupplier).mockRejectedValueOnce(new Error('Permiso denegado')).mockResolvedValue(supplier);
  const change = jest.fn<(value?: Supplier) => Promise<void>>().mockResolvedValue(undefined);
  await render(<ProductSupplier onChange={change} />);
  await fireEvent.press(screen.getByText('Asociar proveedor'));
  expect(screen.getByText('Permiso denegado')).toBeTruthy();
  expect(change).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Asociar proveedor'));
  expect(change).toHaveBeenCalledWith(supplier);
});
