import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import {
  createQuoteRequest,
  subscribeNewsletter,
  type QuoteRequestInput,
} from '@workspace/api-client-react';

type Product = {
  id: number;
  brand: string;
  name: string;
  price: string;
  color: string;
  category: 'POWER_BANKS' | 'CHARGERS' | 'CABLES' | 'TRAVEL';
  image: string;
  sku?: string;
  warranty?: string;
  tag?: string;
};

type HeroSlide = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
};

const asset = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

const products: Product[] = [
  { id: 1, brand: 'Vention', name: 'باور بنك 20,000mAh / 22.5W', price: '$28.09', color: 'USB-C + USB-A + كابل مدمج', category: 'POWER_BANKS', image: asset('vention-powerbank-20k.jpg'), sku: 'XGYP0-40-TY', warranty: 'ضمان 12 شهرًا' },
  { id: 2, brand: 'Vention', name: 'باور بنك 10,000mAh / 22.5W', price: '$24.18 SGD', color: 'كابل شحن مدمج', category: 'POWER_BANKS', image: asset('vention-powerbank-10k.jpg') },
  { id: 3, brand: 'Vention', name: 'باور بنك 10,000mAh / USB-C + Lightning', price: '$24.82 SGD', color: 'USB-C + Lightning مدمجان', category: 'POWER_BANKS', image: asset('vention-powerbank-10k-lightning.jpg') },
  { id: 4, brand: 'Vention', name: 'شاحن GaN بمنفذين 30W', price: '$11.69', color: 'USB-C + USB-A · قابس أوروبي', category: 'CHARGERS', image: asset('vention-charger-30w.jpg') },
  { id: 5, brand: 'Vention', name: 'طقم شحن GaN بقدرة 30W', price: '$15.90', color: 'شاحن + كابل USB-C إلى USB-C', category: 'CHARGERS', image: asset('vention-charger-30w-kit.jpg'), tag: 'باقة جاهزة' },
  { id: 6, brand: 'Vention', name: 'شاحن GaN بثلاثة منافذ 65W', price: '$37.59', color: 'C+C+A · 65W / 65W / 60W', category: 'CHARGERS', image: asset('vention-charger-65w.jpg') },
  { id: 7, brand: 'Vention', name: 'شاحن GaN بثلاثة منافذ 70W', price: '$39.90', color: 'C+C+A · 70W / 70W / 22.5W', category: 'CHARGERS', image: asset('vention-charger-70w.jpg') },
  { id: 8, brand: 'Vention', name: 'شاحن GaN بثلاثة منافذ 100W', price: '$79.39', color: 'C+C+A · 100W / 100W / 30W', category: 'CHARGERS', image: asset('vention-charger-100w.jpg') },
  { id: 9, brand: 'Vention', name: 'كابل USB-C إلى USB-C بقدرة 100W', price: '$11.27 SGD', color: 'شحن سريع 5A · USB 2.0', category: 'CABLES', image: asset('vention-cable-100w.jpg') },
  { id: 10, brand: 'Vention', name: 'محول سفر عالمي GaN بقدرة 65W', price: '$95.88 SGD', color: 'شحن عالمي للسفر', category: 'TRAVEL', image: asset('vention-adapter-65w.jpg') },
];

const heroes: HeroSlide[] = [
  {
    image: asset('vention-powerbank-20k.jpg'),
    eyebrow: 'منتجات Vention الأصلية',
    title: 'اشحن خطوتك القادمة.',
    body: 'حلول شحن وطاقة عملية للاستخدام اليومي، متوفرة الآن من CABL.',
    action: 'تصفح القائمة',
  },
  {
    image: asset('vention-charger-65w.jpg'),
    eyebrow: 'طاقة بلا حجم زائد',
    title: 'تقنية GaN تستحق مكانها.',
    body: 'من أطقم 30W اليومية إلى شواحن 100W متعددة المنافذ، مختارة للسوق المحلي.',
    action: 'تصفح الشواحن',
  },
  {
    image: asset('vention-adapter-65w.jpg'),
    eyebrow: 'جاهز للطريق',
    title: 'محول واحد. أماكن أكثر.',
    body: 'محول سفر عالمي 65W لمن يحتاج إعداد شحن واحدًا في كل مكان.',
    action: 'تصفح محولات السفر',
  },
];

const categories = [
  { name: 'باور بانك', count: '3 منتجات', image: asset('vention-powerbank-10k.jpg'), filter: 'POWER_BANKS' },
  { name: 'شواحن GaN', count: '5 منتجات', image: asset('vention-charger-65w.jpg'), filter: 'CHARGERS' },
  { name: 'كابلات', count: 'منتج واحد', image: asset('vention-cable-100w.jpg'), filter: 'CABLES' },
  { name: 'السفر والسيارة', count: 'منتج واحد', image: asset('vention-adapter-65w.jpg'), filter: 'TRAVEL' },
];

const filterOptions = [
  { value: 'ALL', label: 'كل المنتجات' },
  { value: 'POWER_BANKS', label: 'باور بانك' },
  { value: 'CHARGERS', label: 'الشواحن' },
  { value: 'CABLES', label: 'الكابلات' },
  { value: 'TRAVEL', label: 'السفر والسيارة' },
];

const categoryNames: Record<Product['category'], string> = {
  POWER_BANKS: 'باور بانك',
  CHARGERS: 'الشواحن',
  CABLES: 'الكابلات',
  TRAVEL: 'السفر والسيارة',
};

function CablLogo({ className = '', showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <span className={`cabl-logo ${className}`} aria-label="CABL">
      <svg className="cabl-logo-mark" viewBox="0 0 96 56" role="img" aria-hidden="true">
        <rect x="8" y="8" width="80" height="40" rx="20" fill="none" stroke="currentColor" strokeWidth="8" />
        <rect x="29" y="23" width="38" height="10" rx="5" fill="currentColor" />
      </svg>
      <span className="cabl-logo-copy">
        <strong>CABL</strong>
        {showTagline && <small>الوكيل الحصري لشركة Vention في اليمن</small>}
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
  onToggleFavorite: (id: number) => void;
}) {
  return (
    <section className="product-preview section" aria-label={`تفاصيل ${product.name}`} data-testid="page-product-preview">
      <button className="back-link" type="button" onClick={onBack} data-testid="button-back-products">
        <ArrowRight size={16} /> العودة إلى المنتجات
      </button>
      <div className="product-preview-layout">
        <div className="product-preview-image">
          <img src={product.image} alt={product.name} data-testid={`img-product-preview-${product.id}`} />
        </div>
        <div className="product-preview-copy">
          <span className="eyebrow">{product.brand} · {categoryNames[product.category]}</span>
          <h1>{product.name}</h1>
          <div className="product-preview-price">{product.price}</div>
          <p className="product-preview-description">{product.color}. حل عملي للشحن اليومي، المكتب، والسفر.</p>
          <div className="product-spec-list">
            <div><span>العلامة</span><strong>Vention</strong></div>
            <div><span>الفئة</span><strong>{categoryNames[product.category]}</strong></div>
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
            <span><ShieldCheck size={16} /> منتجات أصلية من Vention</span>
            <span><Sparkles size={16} /> دعم قبل وبعد الشراء</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [slide, setSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => {
    const match = window.location.hash.match(/^#product-(\d+)$/);
    return match ? Number(match[1]) : null;
  });
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = window.localStorage.getItem('cabl-favorites');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : [];
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    customerName: '',
    phone: '',
    businessName: '',
    notes: '',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % heroes.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

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
      const match = window.location.hash.match(/^#product-(\d+)$/);
      setSelectedProductId(match ? Number(match[1]) : null);
    };
    window.addEventListener('popstate', syncProductFromUrl);
    window.addEventListener('hashchange', syncProductFromUrl);
    return () => {
      window.removeEventListener('popstate', syncProductFromUrl);
      window.removeEventListener('hashchange', syncProductFromUrl);
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesFilter = activeFilter === 'ALL' || product.category === activeFilter;
      const matchesQuery = !cleanQuery || `${product.brand} ${product.name} ${product.category}`.toLowerCase().includes(cleanQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const announce = (message: string) => setToast(message);

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

  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    announce(favorites.includes(id) ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة');
  };

  const addToCart = (product: Product) => {
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setCartOpen(true);
    announce(`تمت إضافة ${product.name} إلى القائمة`);
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
    setQuoteOpen(true);
  };

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuoteSubmitting(true);
    setQuoteError('');

    const payload: QuoteRequestInput = {
      customerName: quoteForm.customerName.trim(),
      phone: quoteForm.phone.trim(),
      businessName: quoteForm.businessName.trim() || null,
      notes: quoteForm.notes.trim() || null,
      items: cart.map((product) => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku ?? null,
        quantity: 1,
      })),
    };

    try {
      await createQuoteRequest(payload);
      setQuoteSubmitted(true);
      setCart([]);
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

  const closeQuoteForm = () => {
    setQuoteOpen(false);
    setQuoteSubmitted(false);
    setQuoteError('');
  };

  const updateQuoteField = (field: keyof typeof quoteForm, value: string) => {
    setQuoteForm((current) => ({ ...current, [field]: value }));
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
            <button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="nav-power-banks">باور بانك</button>
            <button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="nav-chargers">الشواحن</button>
            <button type="button" onClick={() => chooseCategory('CABLES')} data-testid="nav-cables">الكابلات</button>
            <button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="nav-travel">السفر والسيارة</button>
            <button type="button" onClick={() => chooseCategory('ALL')} data-testid="nav-brands">Vention</button>
            <button type="button" onClick={() => scrollTo('about')} data-testid="nav-about">عن CABL</button>
            <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="nav-sale">تسوق الآن</button>
          </nav>

          {mobileMenuOpen && (
            <nav className="mobile-nav" aria-label="تنقل الهاتف" data-testid="nav-mobile">
              <button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="mobile-nav-power-banks">باور بانك</button>
              <button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="mobile-nav-chargers">الشواحن</button>
              <button type="button" onClick={() => chooseCategory('CABLES')} data-testid="mobile-nav-cables">الكابلات</button>
              <button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="mobile-nav-travel">السفر والسيارة</button>
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
            isFavorite={favorites.includes(selectedProductId ?? -1)}
            onBack={closeProductPreview}
            onAddToCart={addToCart}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
        <>
        <section className="hero" aria-label="حملات الإلكترونيات" data-testid="section-hero">
          {heroes.map((hero, index) => (
            <article className={`hero-frame ${slide === index ? 'active' : ''}`} key={hero.title} aria-hidden={slide !== index}>
              <img src={hero.image} alt={hero.title} data-testid={`img-hero-${index}`} />
              <div className="hero-shade" />
              <div className="hero-copy">
                <span className="eyebrow">{hero.eyebrow}</span>
                <h1>{hero.title}</h1>
                <p>{hero.body}</p>
                <button className="button-light" type="button" onClick={() => scrollTo('discover')} data-testid={`button-hero-${index}`}>{hero.action}</button>
              </div>
            </article>
          ))}
          <div className="hero-controls" data-testid="controls-hero">
            <button className="hero-arrow" type="button" aria-label="Previous campaign" onClick={() => setSlide((current) => (current - 1 + heroes.length) % heroes.length)} data-testid="button-hero-previous"><ArrowLeft size={17} /></button>
            <div className="hero-dots">
              {heroes.map((hero, index) => (
                <button className={`hero-dot ${slide === index ? 'active' : ''}`} type="button" key={hero.title} aria-label={`Show campaign ${index + 1}`} onClick={() => setSlide(index)} data-testid={`button-hero-dot-${index}`} />
              ))}
            </div>
            <button className="hero-arrow" type="button" aria-label="Next campaign" onClick={() => setSlide((current) => (current + 1) % heroes.length)} data-testid="button-hero-next"><ArrowRight size={17} /></button>
          </div>
        </section>

        <section className="section" id="categories" data-testid="section-categories">
          <div className="section-header">
            <div>
              <span className="eyebrow">ابدأ من هنا</span>
              <h2>طاقة لخطوتك<br />القادمة.</h2>
            </div>
            <p>أربع فئات من منتجات الشحن والطاقة للاستخدام اليومي، المكتب، والسفر.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <button className="category-tile" type="button" key={category.name} onClick={() => chooseCategory(category.filter)} data-testid={`card-category-${category.filter.toLowerCase()}`}>
                <img src={category.image} alt={`${category.name} collection`} data-testid={`img-category-${category.filter.toLowerCase()}`} />
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
            <p>منتجات Vention الأساسية بمواصفات واضحة لتختار ما يناسب أجهزتك ويومك.</p>
          </div>
          <div className="campaign-grid">
            <article className="campaign-card">
              <img src={asset('vention-powerbank-10k.jpg')} alt="Vention power banks" data-testid="img-campaign-season" />
              <span className="campaign-label"><h3>طاقة<br />أينما ذهبت.</h3><button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="button-campaign-season">تصفح الباور بانك</button></span>
            </article>
            <article className="campaign-card">
              <img src={asset('vention-charger-70w.jpg')} alt="Vention GaN chargers" data-testid="img-campaign-women" />
              <span className="campaign-label"><h3>حجم صغير،<br />أداء كبير.</h3><button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="button-campaign-women">تصفح الشواحن</button></span>
            </article>
            <article className="campaign-card">
              <img src={asset('vention-adapter-65w.jpg')} alt="Vention travel adapter" data-testid="img-campaign-men" />
              <span className="campaign-label"><h3>جاهز<br />للسفر.</h3><button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="button-campaign-men">تصفح محولات السفر</button></span>
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
              <p className="about-lead">CABL — منتجات Vention الأصلية للشحن والطاقة داخل اليمن.</p>
              <p>نوفر لك حلولًا عملية للاستخدام اليومي، مع تجربة شراء واضحة ودعم يساعدك في اختيار المنتج المناسب.</p>
            </div>
          </div>
        </section>

        <section className="section" id="discover" data-testid="section-discover">
          <div className="section-header">
            <div>
              <span className="eyebrow">مختارة لرفك</span>
                <h2>منتجات Vention<br />لك.</h2>
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
                  <img src={product.image} alt={product.name} data-testid={`img-product-${product.id}`} />
                  <button className={`wish-button ${favorites.includes(product.id) ? 'active' : ''}`} type="button" onClick={() => toggleFavorite(product.id)} aria-label={`Save ${product.name}`} data-testid={`button-favorite-${product.id}`}>
                    <Heart size={15} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {product.tag && <span className="product-tag">{product.tag}</span>}
                </div>
                <div className="product-details">
                  <div className="product-brand">{product.brand}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">{product.price}</div>
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
          <div className="service-item"><ShieldCheck /><span><strong>منتجات Vention أصلية</strong><span>مواصفات واضحة وضمان عند توفره</span></span></div>
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
              <p>منتجات Vention الأصلية للشحن والطاقة، متوفرة للشراء داخل اليمن.</p>
            </div>
            <div className="footer-col"><h4>تصفح</h4><button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="footer-power-banks">باور بانك</button><button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="footer-chargers">الشواحن</button><button type="button" onClick={() => chooseCategory('CABLES')} data-testid="footer-cables">الكابلات</button><button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="footer-travel">السفر والسيارة</button></div>
            <div className="footer-col"><h4>المتجر</h4><button type="button" onClick={() => scrollTo('discover')} data-testid="footer-shortlist">كل المنتجات</button><button type="button" onClick={() => setCartOpen(true)} data-testid="footer-moq">السلة</button><button type="button" onClick={() => setWishlistOpen(true)} data-testid="footer-pricing">المفضلة</button></div>
            <div className="footer-col"><h4>خدمة العملاء</h4><button type="button" onClick={() => scrollTo('about')} data-testid="footer-about">عن CABL</button><button type="button" onClick={() => scrollTo('services')} data-testid="footer-delivery">الشحن والتوصيل</button><button type="button" onClick={() => scrollTo('discover')} data-testid="footer-help">مواصفات المنتجات</button><button type="button" onClick={openQuoteForm} data-testid="footer-contact">تواصل معنا</button></div>
            <div className="footer-col"><h4>تابعنا</h4><button type="button" onClick={() => announce('تم نسخ رابط Instagram')} data-testid="footer-instagram">Instagram</button><button type="button" onClick={() => announce('تم نسخ رابط TikTok')} data-testid="footer-tiktok">TikTok</button><button type="button" onClick={() => announce('تم نسخ رابط WhatsApp')} data-testid="footer-whatsapp">WhatsApp</button></div>
          </div>
          <div className="footer-bottom"><span>© 2026 CABL. الوكيل الحصري لشركة Vention في اليمن.</span><div className="footer-socials"><button type="button" onClick={() => announce('تم اختيار اليمن')} data-testid="button-country">اليمن <ChevronDown size={12} /></button><button type="button" onClick={() => announce('تم فتح اختيار اللغة')} data-testid="button-language">العربية <ChevronDown size={12} /></button></div></div>
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
                    <div className="cart-item-info"><button className="remove-item" type="button" onClick={() => toggleFavorite(product.id)} data-testid={`button-remove-wishlist-${product.id}`}>إزالة</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>{product.price}</span></div>
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
                  {cart.map((product) => <div className="cart-item" key={product.id}><img src={product.image} alt={product.name} /><div className="cart-item-info"><button className="remove-item" type="button" onClick={() => setCart((current) => current.filter((item) => item.id !== product.id))} data-testid={`button-remove-cart-${product.id}`}>حذف</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>{product.price}</span></div></div>)}
                </div>
                  <div className="drawer-total"><span>المنتجات المختارة</span><span data-testid="text-cart-total">{cart.length}</span></div>
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
              <div className="quote-success" data-testid="status-quote-submitted"><strong>تم استلام طلبك.</strong><p>سنراجع المنتجات المختارة ونتواصل معك على رقم الهاتف المرسل لتأكيد الطلب والتوصيل.</p><button className="button-dark" type="button" onClick={closeQuoteForm} data-testid="button-finish-quote">حسنًا</button></div>
            ) : (
              <form className="quote-form" onSubmit={submitQuote}>
                <p className="quote-intro">{cart.length > 0 ? `سيتم تضمين ${cart.length} منتجًا في طلبك.` : 'أدخل بياناتك لنؤكد طلبك وموعد التوصيل.'}</p>
                <label>الاسم الكامل<input required minLength={2} maxLength={120} value={quoteForm.customerName} onChange={(event) => updateQuoteField('customerName', event.target.value)} autoComplete="name" data-testid="input-quote-name" /></label>
                <label>رقم الهاتف<input required minLength={5} maxLength={40} value={quoteForm.phone} onChange={(event) => updateQuoteField('phone', event.target.value)} autoComplete="tel" data-testid="input-quote-phone" /></label>
                <label>اسم النشاط <span>(اختياري)</span><input maxLength={160} value={quoteForm.businessName} onChange={(event) => updateQuoteField('businessName', event.target.value)} autoComplete="organization" data-testid="input-quote-business" /></label>
                <label>ملاحظات <span>(اختياري)</span><textarea maxLength={1000} rows={4} value={quoteForm.notes} onChange={(event) => updateQuoteField('notes', event.target.value)} data-testid="input-quote-notes" /></label>
                {quoteError && <p className="form-error" role="alert" data-testid="error-quote">{quoteError}</p>}
                <button className="button-dark checkout-button" type="submit" disabled={quoteSubmitting} data-testid="button-submit-quote">{quoteSubmitting ? 'جارٍ إرسال الطلب...' : 'تأكيد الطلب'}</button>
              </form>
            )}
          </section>
        </div>
      )}
      {toast && <div className="toast-message" role="status" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

export default App;