import { createContext, useContext } from 'react';
import type { GetStoreCatalogQueryResult, StoreOrder, StoreCurrency, StoreShippingOption, StorePaymentMethod } from '@workspace/api-client-react';

export type Product = {
  id: string;
  slug: string;
  brand: string;
  brandSlug: string | null;
  name: string;
  regularPrice: number;
  discountPrice: number | null;
  price: number;
  color: string;
  description: string;
  note?: string | null;
  category: { id: string; name: string; slug: string } | null;
  image: string;
  sku: string;
  warranty?: string;
  tag?: string;
  quantity: number;
  shippingOptions: StoreShippingOption[];
};

type StoreContextType = {
  catalog: GetStoreCatalogQueryResult | null;
  catalogLoading: boolean;
  products: Product[];
  categories: any[];
  brands: string[];
  cart: Product[];
  cartQuantities: Record<string, number>;
  favorites: string[];
  currencies: StoreCurrency[];
  shippingOptions: StoreShippingOption[];
  paymentMethods: StorePaymentMethod[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  formatMoney: (amountUsd: number) => string;
  cartItemCount: number;
  cartTotal: number;
  setCartOpen: (open: boolean) => void;
  cartOpen: boolean;
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
};

export const StoreContext = createContext<StoreContextType | null>(null);

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
