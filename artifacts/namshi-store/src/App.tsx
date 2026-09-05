import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChevronDown,
  Download,
  Landmark,
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  WifiOff,
  X,
  Wallet,
} from 'lucide-react';
import {
  createStoreOrder,
  getStoreOrder,
  listStoreOrders,
  subscribeNewsletter,
  type StoreOrder,
  type StorePaymentMethod,
  type StoreProduct,
  type StoreShippingOption,
  type GetStoreCatalogQueryResult,
  useGetStoreCatalog,
} from '@workspace/api-client-react';

type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  color: string;
  category: { id: string; name: string } | null;
  image: string;
  sku: string;
  warranty?: string;
  tag?: string;
  quantity: number;
  shippingOptions: StoreShippingOption[];
};

const asset = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;
const CACHED_CATALOG_KEY = 'cabl-catalog-v1';
const PENDING_ORDERS_KEY = 'cabl-pending-orders-v1';
const WHATSAPP_URL = 'https://wa.me/967771106977?text=' + encodeURIComponent('مرحبًا CABL، أريد الاستفسار عن أحد المنتجات.');
const HOME_TITLE = 'CABL | شاحن جوال أصلي وسريع في اليمن';
const HOME_DESCRIPTION = 'اشترِ شاحن جوال أصلي وسريع، شاحن Type-C وPD وGaN، شاحن آيفون وسامسونج وباور بانك من CABL مع توصيل داخل اليمن.';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function productAlt(product: Product) {
  return `${product.name} من ${product.brand}، ${product.category?.name ?? 'منتج شحن'} أصلي في اليمن`;
}

function readCachedCatalog(): GetStoreCatalogQueryResult | null {
  try {
    const saved = window.localStorage.getItem(CACHED_CATALOG_KEY);
    return saved ? JSON.parse(saved) as GetStoreCatalogQueryResult : null;
  } catch {
    return null;
  }
}

function readPendingOrders(): Array<Parameters<typeof createStoreOrder>[0]> {
  try {
    const saved = window.localStorage.getItem(PENDING_ORDERS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function PaymentMethodIcon({ method }: { method: StorePaymentMethod }) {
  if (method.iconKey === 'bank') return <Landmark size={22} />;
  if (method.iconKey === 'smartphone') return <Smartphone size={22} />;
  if (method.iconKey === 'cash' || !method.requiresTransactionReference) return <Banknote size={22} />;
  if (method.iconKey === 'onecash') return <span className="payment-letter-icon">1</span>;
  return <Wallet size={22} />;
}

function CablLogo({ className = '', showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <span className={`cabl-logo ${className}`} aria-label="CABL">
      <svg className="cabl-logo-mark" viewBox="0 0 96 56" role="img" aria-hidden="true">
        <rect x="8" y="8" width="80" height="40" rx="20" fill="none" stroke="currentColor" strokeWidth="8" />
        <rect x="29" y="23" width="38" height="10" rx="5" fill="currentColor" />
      </svg>
      <span className="cabl-logo-copy">
        <strong>CABL</strong>
        {showTagline && <small>الوكيل الحصري لـ Baseus و Vention في اليمن · منتجات Anker و UGREEN متوفرة</small>}
      </span>
    </span>
  );
}

function ProductPreview({
  product,
  isFavorite,
  onBack,
  onAddToCart,
  onToggleFavorite,
}: {
  product: Product;
  isFavorite: boolean;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <section className="product-preview section" aria-label={`تفاصيل ${product.name}`} data-testid="page-product-preview">
      <button className="back-link" type="button" onClick={onBack} data-testid="button-back-products">
        <ArrowRight size={16} /> العودة إلى المنتجات
      </button>
      <div className="product-preview-layout">
        <div className="product-preview-image">
          <img src={product.image} alt={productAlt(product)} width="900" height="980" data-testid={`img-product-preview-${product.id}`} />
        </div>
        <div className="product-preview-copy">
          <span className="eyebrow">{product.brand} · {product.category?.name ?? '—'}</span>
          <h1>{product.name}</h1>
           <div className="product-preview-price">${product.price.toFixed(2)}</div>
          <p className="product-preview-description">{product.color}. حل عملي للشحن اليومي، المكتب، والسفر.</p>
          <div className="product-spec-list">
            <div><span>العلامة</span><strong>{product.brand}</strong></div>
            <div><span>الفئة</span><strong>{product.category?.name ?? '—'}</strong></div>
            {product.sku && <div><span>SKU</span><strong>{product.sku}</strong></div>}
            {product.warranty && <div><span>الضمان</span><strong>{product.warranty}</strong></div>}
          </div>
          <div className="product-preview-actions">
            <button className="button-dark" type="button" onClick={() => onAddToCart(product)} data-testid={`button-preview-add-${product.id}`}>أضف إلى السلة</button>
            <button className={`preview-wish ${isFavorite ? 'active' : ''}`} type="button" onClick={() => onToggleFavorite(product.id)} data-testid={`button-preview-favorite-${product.id}`}>
              <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'في المفضلة' : 'حفظ للمفضلة'}
            </button>
          </div>
          <div className="product-preview-notes">
            <span><Truck size={16} /> توصيل داخل اليمن</span>
            <span><ShieldCheck size={16} /> منتجات أصلية من {product.brand}</span>
            <span><Sparkles size={16} /> دعم قبل وبعد الشراء</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const catalogQuery = useGetStoreCatalog();
  const [cachedCatalog, setCachedCatalog] = useState<GetStoreCatalogQueryResult | null>(() => readCachedCatalog());
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => (
    window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  ));
  const [slide, setSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    const match = window.location.hash.match(/^#product-([a-zA-Z0-9-]+)$/);
    return match ? match[1] : null;
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('cabl-favorites');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState<Product[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [lastOrder, setLastOrder] = useState<StoreOrder | null>(null);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    country: 'اليمن',
  });
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ email: '', phone: '' });
  const [trackingOrders, setTrackingOrders] = useState<Array<{ id: string; status: string; total: number; createdAt: string }>>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingDetail, setTrackingDetail] = useState<StoreOrder | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const catalog = catalogQuery.data ?? cachedCatalog;

  useEffect(() => {
    const updateConnection = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      announce('تم تثبيت تطبيق CABL بنجاح');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!catalogQuery.data) return;
    setCachedCatalog(catalogQuery.data);
    try {
      window.localStorage.setItem(CACHED_CATALOG_KEY, JSON.stringify(catalogQuery.data));
    } catch {
      // The storefront remains usable even when storage is unavailable.
    }
  }, [catalogQuery.data]);

  useEffect(() => {
    if (!catalog?.products?.length || !navigator.serviceWorker.controller) return;
    const urls = catalog.products.flatMap((product) => product.images.map((image) => (
      image.startsWith('http')
        ? image
        : new URL(`${import.meta.env.BASE_URL}${image}`, window.location.href).href
    )));
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_CATALOG_IMAGES', urls });
  }, [catalog]);

  useEffect(() => {
    const heroCount = Math.min(catalog?.products.length ?? 1, 3);
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % Math.max(heroCount, 1)), 6500);
    return () => window.clearInterval(timer);
  }, [catalog?.products.length]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.localStorage.setItem('cabl-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const syncProductFromUrl = () => {
      const match = window.location.hash.match(/^#product-([a-zA-Z0-9-]+)$/);
      setSelectedProductId(match ? match[1] : null);
    };
    window.addEventListener('popstate', syncProductFromUrl);
    window.addEventListener('hashchange', syncProductFromUrl);
    return () => {
      window.removeEventListener('popstate', syncProductFromUrl);
      window.removeEventListener('hashchange', syncProductFromUrl);
    };
  }, []);

  const products = useMemo<Product[]>(() => (catalog?.products ?? []).map((product: StoreProduct) => ({
    id: product.id,
    brand: product.brand,
    name: product.productName,
    price: product.discountPrice ?? product.regularPrice,
    color: product.shortDescription ?? product.productDescription ?? `منتج أصلي من ${product.brand}`,
    category: product.category,
    image: product.images[0]
      ? product.images[0].startsWith('http') ? product.images[0] : `${import.meta.env.BASE_URL}${product.images[0]}`
      : '',
    sku: product.sku,
    quantity: product.quantity,
    shippingOptions: product.shippingOptions,
  })), [catalog]);

  const shippingOptions = catalog?.shippingOptions ?? [];
  const selectedShippingId = shippingId ?? shippingOptions[0]?.id ?? null;
  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShippingId) ?? null;
  const paymentMethods = catalog?.paymentMethods ?? [];
  const selectedPaymentMethodId = paymentMethodId ?? paymentMethods[0]?.id ?? null;
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedPaymentMethodId) ?? null;
  const cartSubtotal = cart.reduce((sum, product) => sum + product.price * (cartQuantities[product.id] ?? 1), 0);
  const cartShipping = selectedShippingOption?.free ? 0 : selectedShippingOption?.charge ?? 0;
  const cartTotal = cartSubtotal + cartShipping;

  useEffect(() => {
    if (paymentMethods.length > 0 && paymentMethodId === null) {
      setPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethodId, paymentMethods]);

  const visibleProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesFilter = activeFilter === 'ALL' || product.category?.id === activeFilter;
      const matchesQuery = !cleanQuery || `${product.brand} ${product.name} ${product.category?.name ?? ''} ${product.sku} ${product.color}`.toLowerCase().includes(cleanQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, products, query]);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; image: string; count: string }>();
    for (const product of products) {
      if (!product.category || categoryMap.has(product.category.id)) continue;
      categoryMap.set(product.category.id, {
        id: product.category.id,
        name: product.category.name,
        image: product.image,
        count: `${products.filter((item) => item.category?.id === product.category?.id).length} منتجات`,
      });
    }
    return [...categoryMap.values()];
  }, [products]);

  const filterOptions = useMemo(() => [
    { value: 'ALL', label: 'كل المنتجات' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ], [categories]);

  const categoryIdFor = (...hints: string[]) =>
    categories.find((category) => hints.some((hint) => category.name.includes(hint)))?.id ?? 'ALL';

  const heroes = useMemo(() => products.slice(0, 3).map((product) => ({
    productId: product.id,
    categoryId: product.category?.id ?? 'ALL',
    image: product.image,
    eyebrow: product.category?.name ?? 'CABL',
    title: product.name,
    body: product.color,
    action: 'عرض المنتج',
  })), [products]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const announce = (message: string) => setToast(message);

  const installApp = async () => {
    if (!installPrompt) {
      announce('افتح قائمة المتصفح واختر إضافة إلى الشاشة الرئيسية');
      return;
    }
    const promptEvent = installPrompt;
    setInstallPrompt(null);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    announce(choice.outcome === 'accepted' ? 'جاري تثبيت تطبيق CABL' : 'يمكنك تثبيت التطبيق من قائمة المتصفح لاحقًا');
  };

  const flushPendingOrders = async () => {
    if (!navigator.onLine) return;
    const pendingOrders = readPendingOrders();
    if (pendingOrders.length === 0) return;
    const remaining = [...pendingOrders];
    let sentCount = 0;
    while (remaining.length > 0) {
      try {
        await createStoreOrder(remaining[0]);
        remaining.shift();
        sentCount += 1;
      } catch {
        break;
      }
    }
    try {
      if (remaining.length > 0) {
        window.localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(remaining));
      } else {
        window.localStorage.removeItem(PENDING_ORDERS_KEY);
      }
    } catch {
      // A later online visit can retry the order if storage is unavailable.
    }
    if (sentCount > 0) {
      announce(`تم إرسال ${sentCount} طلب محفوظ بعد عودة الاتصال`);
      catalogQuery.refetch();
    }
  };

  useEffect(() => {
    window.addEventListener('online', flushPendingOrders);
    void flushPendingOrders();
    return () => window.removeEventListener('online', flushPendingOrders);
  }, []);

  const openProductPreview = (product: Product) => {
    window.history.pushState({ productId: product.id }, '', `#product-${product.id}`);
    setSelectedProductId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProductPreview = () => {
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}`);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    announce(favorites.includes(id) ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة');
  };

  const addToCart = (product: Product) => {
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setCartQuantities((current) => ({ ...current, [product.id]: Math.min((current[product.id] ?? 0) + 1, 99) }));
    setCartOpen(true);
    announce(`تمت إضافة ${product.name} إلى القائمة`);
  };

  const removeFromCart = (productId: string) => {
    setCartQuantities((current) => {
      const quantity = current[productId] ?? 1;
      if (quantity > 1) return { ...current, [productId]: quantity - 1 };
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setCart((current) => current.filter((product) => product.id !== productId || (cartQuantities[productId] ?? 1) > 1));
  };

  const chooseCategory = (filter: string) => {
    setActiveFilter(filter);
    scrollTo('discover');
  };

  const openQuoteForm = () => {
    setCartOpen(false);
    setWishlistOpen(false);
    setQuoteSubmitted(false);
    setQuoteError('');
    setLastOrder(null);
    setShippingId((current) => current ?? shippingOptions[0]?.id ?? null);
    setPaymentMethodId((current) => current ?? paymentMethods[0]?.id ?? null);
    setPaymentReference('');
    setQuoteOpen(true);
  };

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuoteSubmitting(true);
    setQuoteError('');

    if (!selectedShippingId) {
      setQuoteError('لا توجد طريقة شحن متاحة حاليًا.');
      setQuoteSubmitting(false);
      return;
    }

    const orderPayload: Parameters<typeof createStoreOrder>[0] = {
        customer: {
          firstName: quoteForm.firstName.trim(),
          lastName: quoteForm.lastName.trim(),
          email: quoteForm.email.trim(),
          phoneNumber: quoteForm.phoneNumber.trim(),
        },
        address: {
          addressLine1: quoteForm.addressLine1.trim(),
          addressLine2: null,
          postalCode: null,
          country: quoteForm.country.trim(),
          city: quoteForm.city.trim(),
          phoneNumber: quoteForm.phoneNumber.trim(),
        },
        items: cart.map((product) => ({ productId: product.id, quantity: cartQuantities[product.id] ?? 1 })),
        shippingId: selectedShippingId,
        paymentMethodId: selectedPaymentMethodId,
        paymentReference: selectedPaymentMethod?.requiresTransactionReference ? paymentReference.trim() || null : null,
        couponCode: null,
    };

    if (!navigator.onLine) {
      try {
        window.localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify([...readPendingOrders(), orderPayload]));
      } catch {
        setQuoteError('تعذر حفظ الطلب على هذا الجهاز. اتصل بالإنترنت لإرساله الآن.');
        setQuoteSubmitting(false);
        return;
      }
      setLastOrder(null);
      setQuoteSubmitted(true);
      setCart([]);
      setCartQuantities({});
      announce('تم حفظ الطلب وسيُرسل تلقائيًا عند عودة الاتصال');
      setQuoteSubmitting(false);
      return;
    }

    try {
      const order = await createStoreOrder(orderPayload);
      setLastOrder(order);
      setQuoteSubmitted(true);
      setCart([]);
      setCartQuantities({});
      catalogQuery.refetch();
      announce('تم استلام طلب عرض السعر بنجاح');
    } catch (error) {
      setQuoteError(getApiErrorMessage(error));
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) {
      setNewsletterSubmitting(true);
      setNewsletterError('');
      try {
        await subscribeNewsletter({ email: email.trim() });
        setSubscribed(true);
        announce('تمت إضافتك إلى القائمة');
      } catch (error) {
        setNewsletterError(getApiErrorMessage(error));
      } finally {
        setNewsletterSubmitting(false);
      }
    }
  };

  const favoriteProducts = products.filter((product) => favorites.includes(product.id));
  const selectedProduct = selectedProductId === null
    ? null
    : products.find((product) => product.id === selectedProductId) ?? null;

  useEffect(() => {
    const title = selectedProduct
      ? `${selectedProduct.name} | ${selectedProduct.brand} | CABL اليمن`
      : HOME_TITLE;
    const description = selectedProduct
      ? `${selectedProduct.name} من ${selectedProduct.brand} — ${selectedProduct.category?.name ?? 'شاحن ومنتج شحن'} أصلي مع توصيل داخل اليمن.`
      : HOME_DESCRIPTION;
    document.title = title;
    const setMeta = (selector: string, attribute: 'name' | 'property', content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.includes('og:') ? selector.replace('[property="', '').replace('"]', '') : selector.replace('[name="', '').replace('"]', ''));
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', 'name', description);
    setMeta('meta[property="og:title"]', 'property', title);
    setMeta('meta[property="og:description"]', 'property', description);
    setMeta('meta[name="twitter:title"]', 'name', title);
    setMeta('meta[name="twitter:description"]', 'name', description);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    canonical?.setAttribute('href', `${window.location.origin}${window.location.pathname}`);
  }, [selectedProduct]);

  const closeQuoteForm = () => {
    setQuoteOpen(false);
    setQuoteSubmitted(false);
    setQuoteError('');
  };

  const updateQuoteField = (field: keyof typeof quoteForm, value: string) => {
    setQuoteForm((current) => ({ ...current, [field]: value }));
  };

  const openTracking = () => {
    setTrackingError('');
    setTrackingOrders([]);
    setTrackingDetail(null);
    setTrackingOpen(true);
  };

  const submitTracking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const response = await listStoreOrders({ email: trackingForm.email.trim(), phone: trackingForm.phone.trim() });
      setTrackingOrders(response.orders);
      if (response.orders.length === 0) setTrackingError('لم نجد طلبات بهذه البيانات.');
    } catch (error) {
      setTrackingError(getApiErrorMessage(error));
    } finally {
      setTrackingLoading(false);
    }
  };

  const loadTrackingDetail = async (id: string) => {
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const detail = await getStoreOrder(id, { phone: trackingForm.phone.trim() });
      setTrackingDetail(detail);
    } catch (error) {
      setTrackingError(getApiErrorMessage(error));
    } finally {
      setTrackingLoading(false);
    }
  };

  const getApiErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'data' in error) {
      const data = (error as { data?: { error?: string } }).data;
      if (data?.error) return data.error;
    }
    return error instanceof Error ? error.message : 'تعذر تنفيذ الطلب. حاول مرة أخرى.';
  };

  return (
    <div className="site-shell">
      <header className="main-header" data-testid="header-storefront">
        <div className="header-inner">
          <div className="header-row">
            <button
              className="mobile-menu"
              type="button"
               aria-label="فتح القائمة"
              onClick={() => setMobileMenuOpen((current) => !current)}
              data-testid="button-open-menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button className="wordmark" type="button" onClick={() => scrollTo('top')} data-testid="button-wordmark">
              <CablLogo />
            </button>
            <div className="header-actions">
              <button className="header-action" type="button" onClick={() => setSearchOpen((current) => !current)} aria-label="بحث" data-testid="button-search">
                <Search /><span>بحث</span>
              </button>
              <button className="header-action" type="button" onClick={() => setWishlistOpen(true)} aria-label="المفضلة" data-testid="button-wishlist">
                <Heart /><span>المفضلة</span>
                {favorites.length > 0 && <span className="count-bubble" data-testid="count-wishlist">{favorites.length}</span>}
              </button>
              <button className="header-action" type="button" onClick={() => setCartOpen(true)} aria-label="السلة" data-testid="button-cart">
                <ShoppingBag /><span>السلة</span>
                {cart.length > 0 && <span className="count-bubble" data-testid="count-cart">{cart.length}</span>}
              </button>
            </div>
          </div>

          <nav className="desktop-nav" aria-label="التنقل الرئيسي" data-testid="nav-main">
            {filterOptions.slice(1).map((filter) => <button type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`nav-category-${filter.value}`}>{filter.label}</button>)}
            <button type="button" onClick={() => chooseCategory('ALL')} data-testid="nav-brands">Baseus و Vention و Anker و UGREEN</button>
            <button type="button" onClick={() => scrollTo('about')} data-testid="nav-about">عن CABL</button>
            <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="nav-sale">تسوق الآن</button>
          </nav>

          {mobileMenuOpen && (
            <nav className="mobile-nav" aria-label="تنقل الهاتف" data-testid="nav-mobile">
              {filterOptions.slice(1).map((filter) => <button type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`mobile-nav-category-${filter.value}`}>{filter.label}</button>)}
              <button type="button" onClick={() => scrollTo('about')} data-testid="mobile-nav-about">عن CABL</button>
              <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="mobile-nav-quote">تسوق الآن</button>
            </nav>
          )}

          {searchOpen && (
            <div className="search-panel" data-testid="panel-search">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث عن منتج أو SKU أو مواصفة"
                  aria-label="ابحث عن منتج أو SKU أو مواصفة"
                data-testid="input-search"
              />
               <button className="search-submit" type="button" onClick={() => scrollTo('discover')} aria-label="تنفيذ البحث" data-testid="button-submit-search">
                <Search size={18} />
              </button>
              {query && (
                <div className="search-suggestions" data-testid="search-results-count">
                   <p>{visibleProducts.length} نتيجة للبحث عن «{query}»</p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main id="top">
        {selectedProduct ? (
          <ProductPreview
            product={products.find((product) => product.id === selectedProductId) ?? products[0]}
            isFavorite={selectedProductId !== null && favorites.includes(selectedProductId)}
            onBack={closeProductPreview}
            onAddToCart={addToCart}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
        <>
        <section className="hero" aria-label="حملات الإلكترونيات" data-testid="section-hero">
          {heroes.length > 0 ? heroes.map((hero, index) => (
            <article className={`hero-frame ${slide === index ? 'active' : ''}`} key={hero.productId} aria-hidden={slide !== index}>
              <img src={hero.image} alt={`${hero.title} من CABL`} width="1440" height="620" fetchPriority="high" data-testid={`img-hero-${index}`} />
              <div className="hero-shade" />
              <div className="hero-copy">
                <span className="eyebrow">{hero.eyebrow}</span>
                <h1>{hero.title}</h1>
                <p>{hero.body}</p>
                <button className="button-light" type="button" onClick={() => {
                  setActiveFilter(hero.categoryId);
                  openProductPreview(products.find((product) => product.id === hero.productId)!);
                }} data-testid={`button-hero-${index}`}>{hero.action}</button>
              </div>
            </article>
          )) : (
            <div className="hero-frame active">
              <div className="hero-copy">
                <span className="eyebrow">{catalogQuery.isLoading ? 'جاري تحميل الكتالوج' : 'الكتالوج غير متاح'}</span>
                <h1>{catalogQuery.isLoading ? 'جاري تحميل المنتجات.' : 'لا توجد منتجات منشورة.'}</h1>
                <p>{catalogQuery.isLoading ? 'يتم تحميل البيانات من قاعدة البيانات.' : 'أضف منتجات منشورة من لوحة الإدارة لتظهر هنا.'}</p>
              </div>
            </div>
          )}
          {heroes.length > 0 && <div className="hero-controls" data-testid="controls-hero">
            <button className="hero-arrow" type="button" aria-label="Previous product" onClick={() => setSlide((current) => (current - 1 + heroes.length) % heroes.length)} data-testid="button-hero-previous"><ArrowLeft size={17} /></button>
            <div className="hero-dots">
              {heroes.map((hero, index) => (
                <button className={`hero-dot ${slide === index ? 'active' : ''}`} type="button" key={hero.productId} aria-label={`Show product ${index + 1}`} onClick={() => setSlide(index)} data-testid={`button-hero-dot-${index}`} />
              ))}
            </div>
            <button className="hero-arrow" type="button" aria-label="Next product" onClick={() => setSlide((current) => (current + 1) % heroes.length)} data-testid="button-hero-next"><ArrowRight size={17} /></button>
          </div>}
        </section>

         <section className="brand-announcement" aria-label="وكالة Baseus" data-testid="section-brand-announcement">
           <div><span className="eyebrow">شراكة رسمية</span><h2>Baseus<br />في اليمن.</h2></div>
           <p><strong>CABL هو الوكيل الحصري لعلامة Baseus في اليمن.</strong><br />اكتشف الشواحن والكابلات والبطاريات المحمولة الأصلية، مع توصيل داخل اليمن ودعم محلي.</p>
         </section>

         <section className="section seo-section" aria-labelledby="seo-heading" data-testid="section-seo-content">
           <div className="section-header">
             <div>
               <span className="eyebrow">دليل الشراء في اليمن</span>
               <h2 id="seo-heading">شاحن جوال أصلي<br />وسريع في اليمن.</h2>
             </div>
             <p>اختر شاحنًا مناسبًا لجهازك من كتالوج CABL، مع مواصفات واضحة وخيارات توصيل داخل اليمن.</p>
           </div>
           <div className="seo-grid">
             <article>
               <h3>شاحن سريع وموثوق</h3>
               <p>لشراء شاحن جوال سريع أو شاحن أصلي بسعر مناسب، قارن القدرة والتوافق والمنفذ قبل الطلب. ستجد شواحن USB وType-C وشواحن PD وGaN للاستخدام اليومي والسفر.</p>
             </article>
             <article>
               <h3>آيفون وسامسونج وUSB-C</h3>
               <p>نوفر حلول شحن للآيفون وسامسونج وهواوي وشاومي، إضافة إلى سلك شاحن وكيبل شاحن وشاحن لاسلكي وشاحن سيارة وباور بانك حسب احتياجك.</p>
             </article>
             <article>
               <h3>توصيل داخل اليمن</h3>
               <p>يمكنك شراء شاحن جوال أونلاين من CABL وطلب التوصيل إلى صنعاء أو عدن أو تعز أو الحديدة أو إب أو حضرموت أو مأرب، بحسب خيارات الشحن المتاحة لعنوانك.</p>
             </article>
           </div>
           <div className="seo-faq" aria-label="أسئلة شائعة عن الشواحن">
             <details>
               <summary>أين أجد شاحن جوال أصلي في اليمن؟</summary>
               <p>تصفح منتجات CABL الأصلية من Baseus وVention وAnker وUGREEN، ثم اختر طريقة الدفع والتوصيل المناسبة داخل اليمن.</p>
             </details>
             <details>
               <summary>ما الشاحن المناسب للطاقة الضعيفة أو الاستخدام اليومي؟</summary>
               <p>يعتمد الاختيار على جهازك وقدرة الشاحن المطلوبة. راجع القدرة بالواط، نوع المنفذ، والتوافق قبل شراء شاحن سريع أو شاحن متنقل.</p>
             </details>
             <details>
               <summary>كم سعر الشاحن في اليمن؟</summary>
               <p>تختلف أسعار الشواحن حسب العلامة والقدرة والمواصفات. يعرض الكتالوج سعر كل منتج بوضوح قبل إتمام الطلب.</p>
             </details>
           </div>
         </section>

        <section className="section" id="categories" data-testid="section-categories">
          <div className="section-header">
            <div>
              <span className="eyebrow">ابدأ من هنا</span>
              <h2>طاقة لخطوتك<br />القادمة.</h2>
            </div>
             <p>خمس فئات من منتجات الشحن والطاقة للاستخدام اليومي، المكتب، والسيارة.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <button className="category-tile" type="button" key={category.id} onClick={() => chooseCategory(category.id)} data-testid={`card-category-${category.id}`}>
                <img src={category.image} alt={`${category.name} شواحن ومنتجات في اليمن`} width="600" height="600" loading="lazy" data-testid={`img-category-${category.id}`} />
                <span className="category-info">
                  <h3>{category.name}</h3>
                  <span>{category.count} <ChevronDown size={11} /></span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="section campaign-section" id="campaigns" data-testid="section-campaigns">
          <div className="section-header">
            <div>
              <span className="eyebrow">اختياراتنا</span>
              <h2>اشحن<br />لحظتك.</h2>
            </div>
            <p>منتجات Baseus و Vention و Anker و UGREEN الأصلية بمواصفات واضحة لتختار ما يناسب أجهزتك ويومك.</p>
          </div>
          <div className="campaign-grid">
            <article className="campaign-card">
              <img src={asset('vention-powerbank-10k.jpg')} alt="باور بانك وشاحن متنقل أصلي في اليمن" width="800" height="1000" loading="lazy" data-testid="img-campaign-season" />
              <span className="campaign-label"><h3>طاقة<br />أينما ذهبت.</h3><button type="button" onClick={() => chooseCategory(categoryIdFor('باور', 'طاقة'))} data-testid="button-campaign-season">تصفح {categories.find((category) => category.id === categoryIdFor('باور', 'طاقة'))?.name ?? 'الفئة'}</button></span>
            </article>
            <article className="campaign-card">
              <img src={asset('vention-charger-70w.jpg')} alt="شاحن سريع 70W أصلي في اليمن" width="800" height="1000" loading="lazy" data-testid="img-campaign-women" />
              <span className="campaign-label"><h3>حجم صغير،<br />أداء كبير.</h3><button type="button" onClick={() => chooseCategory(categoryIdFor('شاحن', 'شواحن'))} data-testid="button-campaign-women">تصفح {categories.find((category) => category.id === categoryIdFor('شاحن', 'شواحن'))?.name ?? 'الفئة'}</button></span>
            </article>
            <article className="campaign-card">
              <img src={asset('vention-adapter-65w.jpg')} alt="شاحن Type-C للسفر مع توصيل داخل اليمن" width="800" height="1000" loading="lazy" data-testid="img-campaign-men" />
              <span className="campaign-label"><h3>جاهز<br />للسفر.</h3><button type="button" onClick={() => chooseCategory(categoryIdFor('سفر'))} data-testid="button-campaign-men">تصفح {categories.find((category) => category.id === categoryIdFor('سفر'))?.name ?? 'الفئة'}</button></span>
            </article>
          </div>
        </section>

        <section className="section about-section" id="about" aria-label="عن CABL" data-testid="section-about">
          <div className="about-layout">
            <div>
              <span className="eyebrow">عن CABL</span>
              <h2>كابل<br />لليمن.</h2>
            </div>
            <div className="about-copy">
              <p className="about-lead">CABL — الوكيل الحصري لـ Baseus و Vention، مع منتجات Anker للشحن والطاقة داخل اليمن.</p>
              <p>نوفر لك حلولًا عملية للاستخدام اليومي، مع تجربة شراء واضحة ودعم يساعدك في اختيار المنتج المناسب.</p>
            </div>
          </div>
        </section>

        <section className="section" id="discover" data-testid="section-discover">
          <div className="section-header">
            <div>
              <span className="eyebrow">مختارة لرفك</span>
                <h2>Baseus و Vention و Anker و UGREEN<br />لك.</h2>
            </div>
            <button className="text-link" type="button" onClick={() => { setActiveFilter('ALL'); setQuery(''); }} data-testid="button-view-all">عرض كل المنتجات</button>
          </div>
          <div className="product-toolbar">
            <div className="filter-row" role="tablist" aria-label="Product categories">
              {filterOptions.map((filter) => (
                <button className={`filter-button ${activeFilter === filter.value ? 'active' : ''}`} type="button" key={filter.value} onClick={() => setActiveFilter(filter.value)} data-testid={`filter-${filter.value.toLowerCase()}`}>{filter.label}</button>
              ))}
            </div>
            <button className="sort-button" type="button" onClick={() => announce('يتم عرض أحدث المنتجات')} data-testid="button-sort">الأحدث <ChevronDown size={13} /></button>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id} data-testid={`card-product-${product.id}`}>
                <div className="product-image">
                  <img src={product.image} alt={productAlt(product)} width="800" height="1000" loading="lazy" data-testid={`img-product-${product.id}`} />
                  <button className={`wish-button ${favorites.includes(product.id) ? 'active' : ''}`} type="button" onClick={() => toggleFavorite(product.id)} aria-label={`Save ${product.name}`} data-testid={`button-favorite-${product.id}`}>
                    <Heart size={15} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {product.tag && <span className="product-tag">{product.tag}</span>}
                </div>
                <div className="product-details">
                  <div className="product-brand">{product.brand}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                  <div className="product-color">{product.color}</div>
                  {product.sku && <div className="product-color">SKU: {product.sku}</div>}
                  {product.warranty && <div className="product-color">{product.warranty}</div>}
                   <div className="product-card-actions">
                     <button className="preview-link" type="button" onClick={() => openProductPreview(product)} data-testid={`button-preview-product-${product.id}`}>عرض التفاصيل</button>
                     <button className="text-link" type="button" onClick={() => addToCart(product)} data-testid={`button-add-product-${product.id}`}>أضف إلى السلة</button>
                   </div>
                </div>
              </article>
            ))}
            {visibleProducts.length === 0 && <div className="empty-products" data-testid="empty-product-results">لا توجد منتجات مطابقة. جرّب SKU أو فئة أخرى.</div>}
          </div>
        </section>

        <section className="service-band" id="services" aria-label="خدمات المتجر" data-testid="section-services">
          <div className="service-item"><Truck /><span><strong>توصيل داخل اليمن</strong><span>نرتب الشحن إلى مدينتك عند تأكيد الطلب</span></span></div>
          <div className="service-item"><ShieldCheck /><span><strong>منتجات Baseus و Vention و Anker و UGREEN أصلية</strong><span>مواصفات واضحة وضمان عند توفره</span></span></div>
          <div className="service-item"><Sparkles /><span><strong>دعم قبل وبعد الشراء</strong><span>نساعدك في اختيار الحل المناسب</span></span></div>
        </section>

        <section className="section newsletter" data-testid="section-newsletter">
          <h2>خلّ الطاقة<br />مستمرة.</h2>
          <div className="newsletter-right">
            <p>أدخل بريدك لتصلك المنتجات الجديدة والعروض والتحديثات من CABL.</p>
            {subscribed ? (
              <p data-testid="status-subscribed"><strong>تمت إضافتك إلى القائمة.</strong> تابع بريدك الإلكتروني.</p>
            ) : (
              <form className="email-form" onSubmit={submitEmail}>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="بريدك الإلكتروني" aria-label="بريدك الإلكتروني" data-testid="input-newsletter-email" />
                <button type="submit" disabled={newsletterSubmitting} data-testid="button-newsletter-submit">{newsletterSubmitting ? 'جارٍ الحفظ...' : 'اشترك الآن'} <ArrowRight size={14} /></button>
              </form>
            )}
            {newsletterError && <p className="form-error" role="alert" data-testid="error-newsletter">{newsletterError}</p>}
            <p className="signup-note">بإدخال بريدك، توافق على استلام التحديثات التسويقية.</p>
          </div>
        </section>
        </>
        )}
      </main>

      <footer className="footer" data-testid="footer-storefront">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand" lang="ar" dir="rtl">
              <CablLogo className="cabl-logo-footer" />
              <p>منتجات Baseus و Vention و Anker و UGREEN الأصلية للشحن والطاقة، متوفرة للشراء داخل اليمن.</p>
            </div>
            <div className="footer-col"><h4>تصفح</h4>{filterOptions.slice(1).map((filter) => <button type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`footer-category-${filter.value}`}>{filter.label}</button>)}</div>
            <div className="footer-col"><h4>المتجر</h4><button type="button" onClick={() => scrollTo('discover')} data-testid="footer-shortlist">كل المنتجات</button><button type="button" onClick={() => setCartOpen(true)} data-testid="footer-moq">السلة</button><button type="button" onClick={() => setWishlistOpen(true)} data-testid="footer-pricing">المفضلة</button></div>
            <div className="footer-col"><h4>خدمة العملاء</h4><button type="button" onClick={() => scrollTo('about')} data-testid="footer-about">عن CABL</button><button type="button" onClick={() => scrollTo('services')} data-testid="footer-delivery">الشحن والتوصيل</button><button type="button" onClick={() => scrollTo('discover')} data-testid="footer-help">مواصفات المنتجات</button><button type="button" onClick={openTracking} data-testid="footer-track-order">تتبع طلبك</button><button type="button" onClick={openQuoteForm} data-testid="footer-contact">إتمام الطلب</button></div>
            <div className="footer-col"><h4>تابعنا</h4><button type="button" onClick={() => announce('تم نسخ رابط Instagram')} data-testid="footer-instagram">Instagram</button><button type="button" onClick={() => announce('تم نسخ رابط TikTok')} data-testid="footer-tiktok">TikTok</button><button type="button" onClick={() => announce('تم نسخ رابط WhatsApp')} data-testid="footer-whatsapp">WhatsApp</button></div>
          </div>
          <div className="footer-bottom"><span>© 2026 CABL. الوكيل الحصري لـ Baseus و Vention في اليمن · منتجات Anker و UGREEN متوفرة.</span><div className="footer-socials"><button type="button" onClick={() => announce('تم اختيار اليمن')} data-testid="button-country">اليمن <ChevronDown size={12} /></button><button type="button" onClick={() => announce('تم فتح اختيار اللغة')} data-testid="button-language">العربية <ChevronDown size={12} /></button></div></div>
        </div>
      </footer>

      {wishlistOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setWishlistOpen(false)} data-testid="overlay-wishlist">
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="المفضلة" onClick={(event) => event.stopPropagation()} data-testid="drawer-wishlist">
            <div className="drawer-header"><h2>المفضلة <span>({favoriteProducts.length})</span></h2><button className="close-button" type="button" onClick={() => setWishlistOpen(false)} aria-label="إغلاق المفضلة" data-testid="button-close-wishlist"><X size={16} /></button></div>
            {favoriteProducts.length === 0 ? (
              <div className="cart-empty"><div><Heart size={29} strokeWidth={1.2} /><p>احفظ المنتجات التي تريد العودة إليها لاحقًا.</p><button className="button-dark" type="button" onClick={() => { setWishlistOpen(false); scrollTo('discover'); }} data-testid="button-browse-wishlist">تصفح المنتجات</button></div></div>
            ) : (
              <div>
                {favoriteProducts.map((product) => (
                  <div className="cart-item" key={product.id}>
                    <img src={product.image} alt={product.name} />
                    <div className="cart-item-info"><button className="remove-item" type="button" onClick={() => toggleFavorite(product.id)} data-testid={`button-remove-wishlist-${product.id}`}>إزالة</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>${product.price.toFixed(2)}</span></div>
                  </div>
                ))}
                <button className="button-dark checkout-button" type="button" onClick={openQuoteForm} data-testid="button-quote-wishlist">إتمام الطلب</button>
              </div>
            )}
          </aside>
        </div>
      )}
      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setCartOpen(false)} data-testid="overlay-cart">
            <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="قائمة طلب عرض السعر" onClick={(event) => event.stopPropagation()} data-testid="drawer-cart">
            <div className="drawer-header"><h2>السلة <span>({cart.length})</span></h2><button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة" data-testid="button-close-cart"><X size={16} /></button></div>
            {cart.length === 0 ? (
              <div className="cart-empty"><div><ShoppingBag size={29} strokeWidth={1.2} /><p>أضف المنتجات التي تريد شراءها.</p><button className="button-dark" type="button" onClick={() => { setCartOpen(false); scrollTo('discover'); }} data-testid="button-start-shopping">تصفح المنتجات</button></div></div>
            ) : (
              <>
                <div>
                  {cart.map((product) => <div className="cart-item" key={product.id}><img src={product.image} alt={product.name} /><div className="cart-item-info"><button className="remove-item" type="button" onClick={() => removeFromCart(product.id)} data-testid={`button-remove-cart-${product.id}`}>حذف</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>${product.price.toFixed(2)} · الكمية {cartQuantities[product.id] ?? 1}</span><div className="product-card-actions"><button className="preview-link" type="button" onClick={() => addToCart(product)}>+ إضافة</button><button className="preview-link" type="button" onClick={() => removeFromCart(product.id)}>- إزالة</button></div></div></div>)}
                </div>
                  <div className="drawer-total"><span>المنتجات المختارة</span><span data-testid="text-cart-total">{cart.reduce((sum, product) => sum + (cartQuantities[product.id] ?? 1), 0)}</span></div>
                  <button className="button-dark checkout-button" type="button" onClick={openQuoteForm} data-testid="button-checkout">إتمام الطلب</button>
              </>
            )}
          </aside>
        </div>
      )}
      {quoteOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeQuoteForm} data-testid="overlay-quote">
          <section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-title" onClick={(event) => event.stopPropagation()} data-testid="modal-quote">
            <div className="drawer-header"><h2 id="quote-title">إتمام الطلب</h2><button className="close-button" type="button" onClick={closeQuoteForm} aria-label="إغلاق النموذج" data-testid="button-close-quote"><X size={16} /></button></div>
            {quoteSubmitted ? (
                <div className="quote-success" data-testid="status-quote-submitted">
                  {lastOrder ? <><strong>تم حفظ طلبك بنجاح.</strong><p>رقم الطلب: <strong>{lastOrder.id}</strong></p><p>طريقة الدفع: {lastOrder.paymentMethodName}. حالة الدفع: {lastOrder.paymentStatus === 'cod_pending' ? 'الدفع عند الاستلام' : 'بانتظار مراجعة التحويل'}</p><p>الحالة الحالية: {lastOrder.status}. يمكنك متابعة الشحن من زر تتبع الطلب.</p><div className="product-card-actions"><button className="button-dark" type="button" onClick={openTracking} data-testid="button-track-created-order">تتبع الطلب</button><button className="preview-link" type="button" onClick={closeQuoteForm} data-testid="button-finish-quote">حسنًا</button></div></> : <><strong>تم حفظ طلبك على الجهاز.</strong><p>لا يوجد اتصال حاليًا. سيُرسل الطلب تلقائيًا إلى CABL عند عودة الإنترنت.</p><button className="button-dark" type="button" onClick={closeQuoteForm} data-testid="button-finish-offline-order">حسنًا</button></>}
                </div>
             ) : (
               <form className="quote-form checkout-layout" onSubmit={submitQuote}>
                 <div className="checkout-details">
                   <div className="checkout-heading"><p className="checkout-kicker">CABL · CHECKOUT</p><h3>إتمام الطلب</h3><p className="quote-intro">أدخل بيانات التوصيل ثم اختر طريقة الدفع المناسبة.</p></div>
                   <div className="checkout-section"><h4>بيانات العميل</h4><div className="quote-form-grid"><label>الاسم الأول<input required minLength={2} maxLength={100} value={quoteForm.firstName} onChange={(event) => updateQuoteField('firstName', event.target.value)} autoComplete="given-name" data-testid="input-order-first-name" /></label><label>اسم العائلة<input required minLength={2} maxLength={100} value={quoteForm.lastName} onChange={(event) => updateQuoteField('lastName', event.target.value)} autoComplete="family-name" data-testid="input-order-last-name" /></label></div><div className="quote-form-grid"><label>البريد الإلكتروني<input required type="email" maxLength={255} value={quoteForm.email} onChange={(event) => updateQuoteField('email', event.target.value)} autoComplete="email" data-testid="input-order-email" /></label><label>رقم الهاتف<input required minLength={5} maxLength={40} value={quoteForm.phoneNumber} onChange={(event) => updateQuoteField('phoneNumber', event.target.value)} autoComplete="tel" data-testid="input-order-phone" /></label></div></div>
                   <div className="checkout-section"><h4>بيانات التوصيل</h4><label>العنوان<input required minLength={3} maxLength={500} value={quoteForm.addressLine1} onChange={(event) => updateQuoteField('addressLine1', event.target.value)} autoComplete="street-address" data-testid="input-order-address" /></label><div className="quote-form-grid"><label>المدينة<input required minLength={2} maxLength={100} value={quoteForm.city} onChange={(event) => updateQuoteField('city', event.target.value)} autoComplete="address-level2" data-testid="input-order-city" /></label><label>الدولة<input required minLength={2} maxLength={100} value={quoteForm.country} onChange={(event) => updateQuoteField('country', event.target.value)} autoComplete="country-name" data-testid="input-order-country" /></label></div><label>طريقة الشحن<select required value={selectedShippingId ?? ''} onChange={(event) => setShippingId(Number(event.target.value))} data-testid="select-order-shipping">{shippingOptions.map((option) => <option key={option.id} value={option.id}>{option.name}{option.free ? ' · مجاني' : ` · $${option.charge.toFixed(2)}`}</option>)}</select></label></div>
                   <div className="checkout-section"><h4>طريقة الدفع</h4><label className="payment-select-label"><span>اختر طريقة الدفع</span><select required value={selectedPaymentMethodId ?? ''} onChange={(event) => { setPaymentMethodId(Number(event.target.value)); setPaymentReference(''); }} data-testid="select-payment-method">{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>{selectedPaymentMethod && <div className="payment-instructions" data-testid="payment-instructions"><div className="payment-instructions-title"><span className="payment-method-icon"><PaymentMethodIcon method={selectedPaymentMethod} /></span><strong>{selectedPaymentMethod.name}</strong></div>{selectedPaymentMethod.accountName && <p>اسم الحساب: <b>{selectedPaymentMethod.accountName}</b></p>}{selectedPaymentMethod.accountNumber && <p>رقم الحساب: <b dir="ltr">{selectedPaymentMethod.accountNumber}</b></p>}<p>{selectedPaymentMethod.instructions ?? 'اتبع تعليمات الدفع الظاهرة ثم أكمل الطلب.'}</p>{selectedPaymentMethod.requiresTransactionReference && <label>رقم العملية بعد التحويل<input required value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={255} placeholder="أدخل رقم العملية" data-testid="input-payment-reference" /></label>}</div>}</div>
                   {quoteError && <p className="form-error" role="alert" data-testid="error-quote">{quoteError}</p>}
                   <button className="button-dark checkout-submit-mobile" type="submit" disabled={quoteSubmitting || cart.length === 0 || !selectedPaymentMethodId} data-testid="button-submit-quote">{quoteSubmitting ? 'جارٍ حفظ الطلب...' : selectedPaymentMethod?.requiresTransactionReference ? 'تأكيد التحويل وإرسال الطلب' : 'تأكيد الطلب والدفع عند الاستلام'}</button>
                 </div>
                 <aside className="checkout-summary" aria-label="ملخص الطلب">
                   <div className="summary-heading"><p className="checkout-kicker">ORDER SUMMARY</p><h3>ملخص الطلب</h3></div>
                   <div className="summary-items">{cart.length === 0 ? <p className="summary-empty">السلة فارغة</p> : cart.map((product) => <div className="summary-item" key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>${product.price.toFixed(2)} · الكمية {cartQuantities[product.id] ?? 1}</span></div><button type="button" onClick={() => removeFromCart(product.id)} aria-label={`حذف ${product.name}`} data-testid={`button-remove-summary-${product.id}`}><X size={14} /></button></div>)}</div>
                   <div className="summary-totals"><div><span>الإجمالي الفرعي</span><b>${cartSubtotal.toFixed(2)}</b></div><div><span>رسوم الشحن</span><b>{cartShipping === 0 ? 'مجاني' : `$${cartShipping.toFixed(2)}`}</b></div><div className="summary-total"><strong>الإجمالي</strong><strong>${cartTotal.toFixed(2)}</strong></div></div>
                   <button className="button-dark checkout-submit" type="submit" disabled={quoteSubmitting || cart.length === 0 || !selectedPaymentMethodId} data-testid="button-submit-quote-summary">{quoteSubmitting ? 'جارٍ حفظ الطلب...' : 'تأكيد الطلب'}</button>
                 </aside>
               </form>
            )}
          </section>
        </div>
      )}
      {trackingOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setTrackingOpen(false)} data-testid="overlay-tracking">
          <section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="tracking-title" onClick={(event) => event.stopPropagation()} data-testid="modal-tracking">
            <div className="drawer-header"><h2 id="tracking-title">تتبع طلبك</h2><button className="close-button" type="button" onClick={() => setTrackingOpen(false)} aria-label="إغلاق التتبع"><X size={16} /></button></div>
            <form className="quote-form" onSubmit={submitTracking}>
              <p className="quote-intro">أدخل البريد الإلكتروني ورقم الهاتف المستخدمين عند الطلب لعرض سجل الطلبات وحالة الشحن.</p>
              <label>البريد الإلكتروني<input required type="email" value={trackingForm.email} onChange={(event) => setTrackingForm((current) => ({ ...current, email: event.target.value }))} data-testid="input-tracking-email" /></label>
              <label>رقم الهاتف<input required minLength={5} maxLength={40} value={trackingForm.phone} onChange={(event) => setTrackingForm((current) => ({ ...current, phone: event.target.value }))} data-testid="input-tracking-phone" /></label>
              {trackingError && <p className="form-error" role="alert" data-testid="error-tracking">{trackingError}</p>}
              <button className="button-dark checkout-button" type="submit" disabled={trackingLoading} data-testid="button-submit-tracking">{trackingLoading ? 'جارٍ البحث...' : 'عرض الطلبات'}</button>
            </form>
            {trackingOrders.length > 0 && <div className="tracking-results"><h3>طلباتك</h3>{trackingOrders.map((order) => <button className="tracking-order" key={order.id} type="button" onClick={() => loadTrackingDetail(order.id)}><span><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleDateString('ar-YE')}</small></span><span><strong>${order.total.toFixed(2)}</strong><small>{order.status}</small></span></button>)}</div>}
             {trackingDetail && <div className="quote-success tracking-detail"><strong>{trackingDetail.id}</strong><p>الحالة: {trackingDetail.status}</p><p>الدفع: {trackingDetail.paymentMethodName} · {trackingDetail.paymentStatus === 'cod_pending' ? 'الدفع عند الاستلام' : 'بانتظار مراجعة التحويل'}</p><p>الإجمالي: ${trackingDetail.total.toFixed(2)} · الشحن: ${trackingDetail.shippingCost.toFixed(2)}</p><div>{trackingDetail.items.map((item) => <p key={item.productId}>{item.productName} × {item.quantity}</p>)}</div></div>}
          </section>
        </div>
      )}
      {isOffline && <div className="offline-badge" role="status" data-testid="status-offline"><WifiOff size={14} /> تعمل دون اتصال · البيانات المحفوظة متاحة</div>}
      {!isAppInstalled && <button className="install-float" type="button" onClick={installApp} aria-label="تثبيت تطبيق CABL" data-testid="button-install-app"><Download size={18} /><span>تثبيت التطبيق</span></button>}
      <a className="whatsapp-float" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="تواصل معنا عبر WhatsApp" data-testid="button-whatsapp-float">
        <MessageCircle size={25} fill="currentColor" />
        <span>WhatsApp</span>
      </a>
      {toast && <div className="toast-message" role="status" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

export default App;