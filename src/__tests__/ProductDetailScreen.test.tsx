import { render, screen } from '@testing-library/react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import { useProductStore } from '../store/useProductStore';
import type { Product } from '../types/models';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback: () => void) => callback() }));
jest.mock('../components/ProductPhoto', () => ({ __esModule: true, default: () => require('react').createElement(require('react-native').Text, null, 'Foto: sin asociar') }));
jest.mock('../components/ProductLocation', () => ({ __esModule: true, default: ({ location }: any) => require('react').createElement(require('react-native').Text, null, location ? `GPS: ${location.latitude}` : 'GPS: sin asociar') }));
jest.mock('../components/ProductSupplier', () => ({ __esModule: true, default: ({ supplier }: any) => require('react').createElement(require('react-native').Text, null, supplier ? `Proveedor: ${supplier.name}` : 'Proveedor: sin asociar') }));
jest.mock('../components/ProductCalendarReminder', () => ({ __esModule: true, default: ({ productId, event }: any) => require('react').createElement(require('react-native').Text, null, `Calendario ${productId}: ${event?.eventId ?? 'sin asociar'}`) }));

const product: Product = { id: 'p1', name: 'Leche', quantity: 2, purchased: false };
const props: any = { route: { key: 'detail', name: 'DetalleProducto', params: { productId: 'p1' } }, navigation: {} };

beforeEach(() => {
  useProductStore.setState({ products: [product], loaded: true, loading: false, loadError: '' });
});

it('presenta secciones de adjuntos y acciones avanzadas reutilizadas para un producto simple', async () => {
  await render(<ProductDetailScreen {...props} />);
  expect(screen.getByText('Foto')).toBeTruthy();
  expect(screen.getByText('Comercio y ubicación')).toBeTruthy();
  expect(screen.getByText('Proveedor')).toBeTruthy();
  expect(screen.getByText('Calendario')).toBeTruthy();
  expect(screen.getByText('Foto: sin asociar')).toBeTruthy();
  expect(screen.getByText('GPS: sin asociar')).toBeTruthy();
  expect(screen.getByText('Proveedor: sin asociar')).toBeTruthy();
  expect(screen.getByText('Calendario p1: sin asociar')).toBeTruthy();
});

it('muestra los datos ya asociados sin perder la identidad del producto', async () => {
  useProductStore.setState({ products: [{ ...product, photoUri: undefined, location: { latitude: -34, longitude: -58 }, supplier: { name: 'Ana', phone: '123' }, calendarEvent: { eventId: 'ev1', calendarId: 'cal1', startDate: '2027-01-01T10:00:00.000Z' } }] });
  await render(<ProductDetailScreen {...props} />);
  expect(screen.getByText('Leche')).toBeTruthy();
  expect(screen.getByText('Proveedor: Ana')).toBeTruthy();
  expect(screen.getByText('Calendario p1: ev1')).toBeTruthy();
  expect(screen.getByText('GPS: -34')).toBeTruthy();
});
