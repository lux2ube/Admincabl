import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useGetStoreCatalog } from '@workspace/api-client-react';
import type { StoreProduct, StoreCurrency, StoreShippingOption, StorePaymentMethod, GetStoreCatalogQueryResult } from '@workspace/api-client-react';

type StoreContextType = {
  catalog: GetStoreCatalogQueryResult | undefined;
  isLoading: boolean;
  products: StoreProduct[];
  categories: { id: string; name: string; slug: string }[];
  brands: { name: string; slug: string }[];
  cart: StoreProduct[];
  cartQuantities: Record<string, number>;
  favorites: string[];
  currencies: StoreCurrency[];
  shippingOptions: StoreShippingOption[];
  paymentMethods: StorePaymentMethod[];
  addToCart: (product: StoreProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  formatMoney: (amountUsd: number) => string;
  cartItemCount: number;
  cartTotal: number;
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data: catalog, isLoading } = useGetStoreCatalog();

  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('cabl_cart') || '{}');
    } catch {
      return {};
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cabl_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    return localStorage.getItem('cabl_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('cabl_cart', JSON.stringify(cartQuantities));
  }, [cartQuantities]);

  useEffect(() => {
    localStorage.setItem('cabl_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('cabl_currency', currencyCode);
  }, [currencyCode]);

  const products = catalog?.products || [];
  const currencies = catalog?.currencies || [];
  const shippingOptions = catalog?.shippingOptions || [];
  const paymentMethods = catalog?.paymentMethods || [];

  const categoriesMap = new Map();
  const brandsMap = new Map();

  products.forEach(p => {
    if (p.category) {
      categoriesMap.set(p.category.id, p.category);
    }
    if (p.brand && p.brandSlug) {
      brandsMap.set(p.brandSlug, { name: p.brand, slug: p.brandSlug });
    }
  });

  const categories = Array.from(categoriesMap.values());
  const brands = Array.from(brandsMap.values());

  const cart = products.filter(p => cartQuantities[p.id] > 0);

  const cartItemCount = Object.values(cartQuantities).reduce((a, b) => a + b, 0);
  const cartTotal = cart.reduce((total, p) => {
    const price = p.discountPrice ?? p.regularPrice;
    return total + (price * (cartQuantities[p.id] || 0));
  }, 0);

  const addToCart = (product: StoreProduct, quantity = 1) => {
    setCartQuantities(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + quantity
    }));
  };

  const removeFromCart = (productId: string) => {
    setCartQuantities(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const clearCart = () => setCartQuantities({});

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Convert and format based on selected currency
  const formatMoney = (amountUsd: number) => {
    const currency = currencies.find(c => c.code === currencyCode) || currencies[0] || { code: 'USD', ratePerUsd: 1 };
    const converted = amountUsd * currency.ratePerUsd;
    
    return new Intl.NumberFormat('ar-YE', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(converted);
  };

  return (
    <StoreContext.Provider value={{
      catalog,
      isLoading,
      products,
      categories,
      brands,
      cart,
      cartQuantities,
      favorites,
      currencies,
      shippingOptions,
      paymentMethods,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleFavorite,
      formatMoney,
      cartItemCount,
      cartTotal,
      currencyCode,
      setCurrencyCode
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
