import { create } from 'zustand';
import type { Product } from '../types/models';
import { getProducts, saveProducts } from '../storage/productStorage';
import { isProductNameValid, isQuantityValid } from '../utils/validation';
import { isPhotoReferenceValid } from '../utils/photoReference';
import { isProductLocationValid } from '../utils/productLocation';
import { isProductSupplierValid } from '../utils/productSupplier';

type ProductInput = Pick<Product, 'name' | 'quantity' | 'photoUri' | 'location' | 'supplier'>;
type ProductChanges = Partial<Pick<Product, 'name' | 'quantity' | 'purchased' | 'photoUri' | 'location' | 'supplier' | 'calendarEvent'>>;

export interface ProductStore {
  products: Product[];
  loaded: boolean;
  loading: boolean;
  busy: boolean;
  loadError: string;
  error: string;
  load: () => Promise<void>;
  add: (input: ProductInput) => Promise<void>;
  update: (id: string, changes: ProductChanges) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function validate(product: ProductInput) {
  if (product.supplier !== undefined && !isProductSupplierValid(product.supplier)) throw new Error('El proveedor no es válido.');
  if (product.location !== undefined && !isProductLocationValid(product.location)) throw new Error('La ubicación no es válida.');
  if (!isPhotoReferenceValid(product.photoUri)) throw new Error('La referencia de la foto no es válida.');
  if (!isProductNameValid(product.name)) throw new Error('Ingresá el nombre del producto.');
  if (!isQuantityValid(product.quantity)) throw new Error('La cantidad debe ser un número entero mayor o igual a 1.');
}

// Each instance owns its queue; the application uses the singleton below.
export function createProductStore() {
  return create<ProductStore>((set, get) => {
    let loadingPromise: Promise<void> | undefined;
    let queue: Promise<void> = Promise.resolve();
    let pending = 0;

    function load(): Promise<void> {
      if (loadingPromise) return loadingPromise;
      if (get().loaded) return Promise.resolve();
      set({ loading: true, loadError: '' });
      loadingPromise = getProducts()
        .then((products) => { set({ products, loaded: true }); })
        .catch((cause: unknown) => {
          set({ loadError: 'No se pudo cargar la lista. Intentá nuevamente.' });
          throw cause;
        })
        .finally(() => {
          loadingPromise = undefined;
          set({ loading: false });
        });
      return loadingPromise;
    }

    function mutate(transform: (products: Product[]) => Product[], message: string) {
      pending += 1;
      set({ busy: true });
      const operation = queue.then(async () => {
        set({ error: '' });
        try {
          await load();
          const products = transform(get().products);
          await saveProducts(products);
          set({ products });
        } catch (cause) {
          set({ error: message });
          throw cause;
        } finally {
          pending -= 1;
          set({ busy: pending > 0 });
        }
      });
      queue = operation.catch(() => undefined);
      return operation;
    }

    const changeError = 'No se pudo guardar el cambio. Intentá nuevamente.';
    return {
      products: [], loaded: false, loading: false, busy: false, loadError: '', error: '', load,
      add: (input) => mutate((products) => {
        validate(input);
        let id = Date.now().toString();
        while (products.some((product) => product.id === id)) id = (Number(id) + 1).toString();
        return [...products, { id, name: input.name.trim(), quantity: input.quantity, purchased: false, ...(input.photoUri ? { photoUri: input.photoUri } : {}), ...(input.location ? { location: input.location } : {}), ...(input.supplier ? { supplier: input.supplier } : {}) }];
      }, 'No se pudo guardar el producto. Intentá nuevamente.'),
      update: (id, changes) => mutate((products) => products.map((product) => {
        if (product.id !== id) return product;
        const next = { ...product, ...changes, id: product.id };
        validate(next);
        if (typeof next.purchased !== 'boolean') throw new Error('Estado de producto inválido.');
        return { ...next, name: next.name.trim() };
      }), changeError),
      toggle: (id) => mutate((products) => products.map((product) =>
        product.id === id ? { ...product, purchased: !product.purchased } : product
      ), changeError),
      remove: (id) => mutate((products) => products.filter((product) => product.id !== id), changeError),
    };
  });
}

export const useProductStore = createProductStore();