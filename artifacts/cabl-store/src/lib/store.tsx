import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGetStoreCatalog } from '@workspace/api-client-react';
import type { StoreCatalog, StoreProduct } from '@workspace/api-client-react';

export type CartLine = { productId: string; quantity: number };
type StoreContextValue = {
  catalog: StoreCatalog | undefined;
  isLoading: boolean;
  isError: boolean;
  cart: CartLine[];
  favorites: string[];
  addToCart: (productId: string, quantity?: number) => void;
  updateCart: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  cartProducts: Array<{ product: StoreProduct; quantity: number }>;
  cartCount: number;
  currency: StoreCatalog['currencies'][number] | undefined;
  setCurrencyCode: (code: string) => void;
  formatPrice: (usd: number) => string;
};
const StoreContext = createContext<StoreContextValue | null>(null);
const readStorage = (key: string): unknown => {
  try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return null; }
};
const normalizeCart = (value: unknown, products: StoreProduct[]): CartLine[] => {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const line = item as Partial<CartLine>;
    const product = products.find((candidate) => candidate.id === line.productId);
    const quantity = Number(line.quantity);
    if (!product || !Number.isFinite(quantity) || quantity < 1 || product.quantity < 1) continue;
    quantities.set(product.id, (quantities.get(product.id) || 0) + Math.floor(quantity));
  }
  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity: Math.min(quantity, products.find((product) => product.id === productId)?.quantity || 1),
  }));
};
export function StoreProvider({ children }: { children: ReactNode }) {
  const query = useGetStoreCatalog();
  const [cart, setCart] = useState<CartLine[]>(() => {
    const stored = readStorage('cabl-cart');
    return Array.isArray(stored) ? stored as CartLine[] : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = readStorage('cabl-favorites');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  });
  const [currencyCode, setCurrencyCode] = useState(() => localStorage.getItem('cabl-currency') || 'YER');
  useEffect(() => localStorage.setItem('cabl-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('cabl-favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('cabl-currency', currencyCode), [currencyCode]);
  const catalog = query.data;
  const currency = catalog?.currencies.find((item) => item.code === currencyCode)
    || catalog?.currencies.find((item) => item.code === 'YER')
    || catalog?.currencies.find((item) => item.isDefault)
    || catalog?.currencies[0];
  useEffect(() => {
    if (!catalog?.currencies.length) return;
    if (catalog.currencies.some((item) => item.code === currencyCode)) return;
    setCurrencyCode(catalog.currencies.find((item) => item.code === 'YER')?.code || catalog.currencies.find((item) => item.isDefault)?.code || catalog.currencies[0].code);
  }, [catalog, currencyCode]);
  useEffect(() => {
    if (!catalog) return;
    setCart((current) => {
      const normalized = normalizeCart(current, catalog.products);
      return JSON.stringify(normalized) === JSON.stringify(current) ? current : normalized;
    });
  }, [catalog]);
  const cartProducts = useMemo(() => cart.flatMap((line) => {
    const product = catalog?.products.find((item) => item.id === line.productId);
    return product ? [{ product, quantity: line.quantity }] : [];
  }), [cart, catalog]);
  const value: StoreContextValue = {
    catalog, isLoading: query.isLoading, isError: query.isError, cart, favorites,
    addToCart: (productId, quantity = 1) => setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      const product = catalog?.products.find((item) => item.id === productId);
      const maxQuantity = product?.quantity ?? 99;
      if (maxQuantity < 1) return current;
      return existing
        ? current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(maxQuantity, line.quantity + quantity) } : line)
        : [...current, { productId, quantity: Math.min(maxQuantity, Math.max(1, quantity)) }];
    }),
    updateCart: (productId, quantity) => setCart((current) => {
      if (quantity < 1) return current.filter((line) => line.productId !== productId);
      const product = catalog?.products.find((item) => item.id === productId);
      const maxQuantity = product?.quantity ?? 99;
      return maxQuantity < 1
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(maxQuantity, quantity) } : line);
    }),
    removeFromCart: (productId) => setCart((current) => current.filter((line) => line.productId !== productId)),
    toggleFavorite: (productId) => setFavorites((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]),
    cartProducts, cartCount: cartProducts.reduce((sum, line) => sum + line.quantity, 0), currency, setCurrencyCode,
    formatPrice: (usd) => {
      const code = currency?.code || 'YER';
      const converted = usd * (currency?.ratePerUsd || 1);
      const displayStep = code === 'YER' ? 100 : code === 'SAR' ? 1 : 1;
      const displayAmount = code === 'YER'
        ? Math.floor(converted / displayStep) * displayStep
        : code === 'SAR'
          ? Math.floor(converted)
          : converted;
      return new Intl.NumberFormat('ar-YE', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(displayAmount);
    },
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}