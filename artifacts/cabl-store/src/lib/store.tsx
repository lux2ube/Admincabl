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
  formatPrice: (usd: number) => string;
};
const StoreContext = createContext<StoreContextValue | null>(null);
const readStorage = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
};
export function StoreProvider({ children }: { children: ReactNode }) {
  const query = useGetStoreCatalog();
  const [cart, setCart] = useState<CartLine[]>(() => readStorage('cabl-cart', []));
  const [favorites, setFavorites] = useState<string[]>(() => readStorage('cabl-favorites', []));
  useEffect(() => localStorage.setItem('cabl-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('cabl-favorites', JSON.stringify(favorites)), [favorites]);
  const catalog = query.data;
  const currency = catalog?.currencies.find((item) => item.isDefault) || catalog?.currencies[0];
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
    cartProducts, cartCount: cart.reduce((sum, line) => sum + line.quantity, 0), currency,
    formatPrice: (usd) => new Intl.NumberFormat('ar-YE', { style: 'currency', currency: currency?.code || 'USD', maximumFractionDigits: 0 }).format(usd * (currency?.ratePerUsd || 1)),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}