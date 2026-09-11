import { useState, useCallback, useMemo, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { StoreContext, type Product } from './lib/StoreContext';
import { GetStoreCatalogQueryResult, StoreCurrency } from '@workspace/api-client-react';

import { StoreShell } from './components/StoreShell';
import { Home } from './pages/Home';
import { Category } from './pages/Category';
import { Brand } from './pages/Brand';
import { ProductPage } from './pages/ProductPage';
import { Checkout } from './pages/Checkout';
import { Search } from './pages/Search';
import { Favorites } from './pages/Favorites';

const CACHED_CATALOG_KEY = 'cabl-catalog-v1';
const DEFAULT_CURRENCIES: StoreCurrency[] = [
  { code: 'YER', name: 'ريال يمني', ratePerUsd: 535, isDefault: true },
  { code: 'NYER', name: 'ريال يمني جديد', ratePerUsd: 1572, isDefault: false },
  { code: 'SAR', name: 'ريال سعودي', ratePerUsd: 3.83, isDefault: false },
];

const PRODUCT_ROUTE_ALIASES: Record<string, string> = {
  'anker/power-banks/anker-powercore-10000': 'bawr-bnk-anker-bsah-10-000mah',
  'product/anker-powercore-10000': 'bawr-bnk-anker-bsah-10-000mah',
};

function readCachedCatalog(): GetStoreCatalogQueryResult | null {
  try {
    const cached = window.localStorage.getItem(CACHED_CATALOG_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as GetStoreCatalogQueryResult;
  } catch {
    return null;
  }
}

export default function App() {
  const [catalog, setCatalog] = useState<GetStoreCatalogQueryResult | null>(() => readCachedCatalog());
  const [catalogLoading, setCatalogLoading] = useState(true);
  
  const [currencyCode, setCurrencyCode] = useState(() => {
    try {
      return window.localStorage.getItem('cabl-currency') ?? 'YER';
    } catch {
      return 'YER';
    }
  });

  const [cart, setCart] = useState<Product[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('cabl-cart') || '[]');
    } catch {
      return [];
    }
  });
  
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('cabl-cart-quantities') || '{}');
    } catch {
      return {};
    }
  });
  
  const [cartOpen, setCartOpen] = useState(false);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('cabl-favorites') || '[]');
    } catch {
      return [];
    }
  });
  
  const [location, setLocation] = useLocation();

  useEffect(() => {
    window.localStorage.setItem('cabl-cart', JSON.stringify(cart));
    window.localStorage.setItem('cabl-cart-quantities', JSON.stringify(cartQuantities));
  }, [cart, cartQuantities]);

  useEffect(() => {
    window.localStorage.setItem('cabl-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/store/catalog`, {
      headers: { Accept: 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        setCatalog(data);
        setCatalogLoading(false);
        try {
          window.localStorage.setItem(CACHED_CATALOG_KEY, JSON.stringify(data));
        } catch {}
      })
      .catch(err => {
        console.error(err);
        setCatalogLoading(false);
      });
  }, []);

  const products = useMemo<Product[]>(() => {
    if (!catalog?.products) return [];
    return catalog.products.map(p => ({
      id: p.id,
      slug: p.slug,
      brand: p.brand,
      brandSlug: p.brandSlug,
      name: p.productName,
      regularPrice: p.regularPrice,
      discountPrice: p.discountPrice,
      price: p.discountPrice ?? p.regularPrice,
      color: p.shortDescription || p.productDescription || `منتج أصلي من ${p.brand}`,
      description: p.productDescription || p.shortDescription || `منتج أصلي من ${p.brand} متوفر في متجر CABL.`,
      note: p.productNote,
      category: p.category ? { id: String(p.category.id), name: p.category.name, slug: p.category.slug } : null,
      image: p.images?.[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${import.meta.env.BASE_URL}${p.images[0]}`) : '',
      sku: p.sku || '',
      quantity: p.quantity,
      shippingOptions: p.shippingOptions || [],
      warranty: p.productNote ?? undefined,
    }));
  }, [catalog]);

  const categories = useMemo(() => {
    const cats = new Map();
    products.forEach(p => {
      if (p.category) {
        cats.set(p.category.slug, p.category);
      }
    });
    return Array.from(cats.values());
  }, [products]);

  const brands = useMemo(() => {
    const b = new Set(products.map(p => p.brandSlug).filter((b): b is string => Boolean(b)));
    return Array.from(b);
  }, [products]);

  const availableCurrencies = catalog?.currencies?.length ? catalog.currencies : DEFAULT_CURRENCIES;
  const selectedCurrency = useMemo(() => {
    return availableCurrencies.find((c) => c.code === currencyCode)
      ?? availableCurrencies.find((c) => c.isDefault)
      ?? DEFAULT_CURRENCIES[0];
  }, [availableCurrencies, currencyCode]);

  useEffect(() => {
    if (selectedCurrency.code !== currencyCode) setCurrencyCode(selectedCurrency.code);
    try {
      window.localStorage.setItem('cabl-currency', selectedCurrency.code);
    } catch {}
  }, [currencyCode, selectedCurrency]);

  const formatMoney = useCallback((amountUsd: number) => {
    const decimals = selectedCurrency.code === 'SAR' ? 2 : 0;
    const amount = new Intl.NumberFormat('ar-YE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amountUsd * selectedCurrency.ratePerUsd);
    return `${amount} ${selectedCurrency.name}`;
  }, [selectedCurrency]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (product.quantity <= 0) {
      alert('هذا المنتج غير متوفر حاليًا');
      return;
    }
    const currentQuantity = cartQuantities[product.id] ?? 0;
    const targetQuantity = currentQuantity > 0 && quantity === 1 ? currentQuantity + 1 : quantity;
    
    if (targetQuantity > Math.min(product.quantity, 99)) {
      alert(`المتاح من ${product.name} هو ${product.quantity} فقط`);
      return;
    }

    setCart(curr => {
      if (!curr.find(p => p.id === product.id)) {
        return [...curr, product];
      }
      return curr;
    });
    setCartQuantities(curr => ({
      ...curr,
      [product.id]: targetQuantity
    }));
    setCartOpen(true);
  }, [cartQuantities]);

  const removeFromCart = useCallback((productId: string) => {
    setCartQuantities(curr => {
      const q = curr[productId] || 0;
      if (q > 1) {
        return { ...curr, [productId]: q - 1 };
      }
      const next = { ...curr };
      delete next[productId];
      return next;
    });
    setCart(curr => {
      if ((cartQuantities[productId] || 0) <= 1) {
        return curr.filter(p => p.id !== productId);
      }
      return curr;
    });
  }, [cartQuantities]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartQuantities({});
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(curr => 
      curr.includes(productId) 
        ? curr.filter(id => id !== productId)
        : [...curr, productId]
    );
  }, []);

  const cartItemCount = Object.values(cartQuantities).reduce((acc, q) => acc + q, 0);
  const cartTotal = cart.reduce((acc, product) => acc + (product.price * (cartQuantities[product.id] || 1)), 0);

  const storeContextValue = {
    catalog,
    catalogLoading,
    products,
    categories,
    brands,
    cart,
    cartQuantities,
    favorites,
    currencies: availableCurrencies,
    shippingOptions: catalog?.shippingOptions ?? [],
    paymentMethods: catalog?.paymentMethods ?? [],
    addToCart,
    removeFromCart,
    clearCart,
    toggleFavorite,
    formatMoney,
    cartItemCount,
    cartTotal,
    setCartOpen,
    cartOpen,
    currencyCode,
    setCurrencyCode
  };

  return (
    <StoreContext.Provider value={storeContextValue}>
      <StoreShell>
        {catalogLoading && products.length === 0 ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/power-banks">
              {() => <Category categorySlug="power-banks" />}
            </Route>
            <Route path="/chargers">
              {() => <Category categorySlug="chargers" />}
            </Route>
            <Route path="/cables">
              {() => <Category categorySlug="cables" />}
            </Route>
            <Route path="/car-accessories">
              {() => <Category categorySlug="car-accessories" />}
            </Route>
            <Route path="/anker">
              {() => <Brand brandSlug="anker" />}
            </Route>
            <Route path="/baseus">
              {() => <Brand brandSlug="baseus" />}
            </Route>
            <Route path="/ugreen">
              {() => <Brand brandSlug="ugreen" />}
            </Route>
            <Route path="/vention">
              {() => <Brand brandSlug="vention" />}
            </Route>
            <Route path="/product/:slug">
              {({ slug }) => <ProductPage slug={PRODUCT_ROUTE_ALIASES[`product/${slug}`] || slug} />}
            </Route>
            <Route path="/checkout" component={Checkout} />
            <Route path="/search" component={Search} />
            <Route path="/favorites" component={Favorites} />
            <Route path="/:brandSlug/:categorySlug/:slug">
              {({ brandSlug, categorySlug, slug }) => {
                const resolvedSlug = PRODUCT_ROUTE_ALIASES[`${brandSlug}/${categorySlug}/${slug}`] || slug;
                return <ProductPage slug={resolvedSlug} />
              }}
            </Route>
            <Route>
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <h1 className="font-display font-bold text-4xl text-slate-800 mb-4">404</h1>
                <p className="text-slate-600 font-semibold mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
                <a href="/" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors">العودة للرئيسية</a>
              </div>
            </Route>
          </Switch>
        )}
      </StoreShell>
    </StoreContext.Provider>
  );
}