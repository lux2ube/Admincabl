import { useEffect, useMemo, useState } from 'react';
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
  { id: 1, brand: 'Vention', name: 'باور بنك 20,000mAh / 22.5W', price: '$28.09', color: 'USB-C + USB-A + كابل مدمج', category: 'POWER_BANKS', image: asset('vention-powerbank-20k.jpg'), sku: 'XGYP0-40-TY', warranty: 'ضمان 12 شهرًا', tag: 'سعر مرجعي' },
  { id: 2, brand: 'Vention', name: 'باور بنك 10,000mAh / 22.5W', price: '$24.18 SGD', color: 'كابل شحن مدمج', category: 'POWER_BANKS', image: asset('vention-powerbank-10k.jpg'), tag: 'سعر مرجعي' },
  { id: 3, brand: 'Vention', name: 'باور بنك 10,000mAh / USB-C + Lightning', price: '$24.82 SGD', color: 'USB-C + Lightning مدمجان', category: 'POWER_BANKS', image: asset('vention-powerbank-10k-lightning.jpg'), tag: 'سعر مرجعي' },
  { id: 4, brand: 'Vention', name: 'شاحن GaN بمنفذين 30W', price: '$11.69', color: 'USB-C + USB-A · قابس أوروبي', category: 'CHARGERS', image: asset('vention-charger-30w.jpg'), tag: 'سعر مرجعي' },
  { id: 5, brand: 'Vention', name: 'طقم شحن GaN بقدرة 30W', price: '$15.90', color: 'شاحن + كابل USB-C إلى USB-C', category: 'CHARGERS', image: asset('vention-charger-30w-kit.jpg'), tag: 'باقة جاهزة' },
  { id: 6, brand: 'Vention', name: 'شاحن GaN بثلاثة منافذ 65W', price: '$37.59', color: 'C+C+A · 65W / 65W / 60W', category: 'CHARGERS', image: asset('vention-charger-65w.jpg'), tag: 'سعر مرجعي' },
  { id: 7, brand: 'Vention', name: 'شاحن GaN بثلاثة منافذ 70W', price: '$39.90', color: 'C+C+A · 70W / 70W / 22.5W', category: 'CHARGERS', image: asset('vention-charger-70w.jpg'), tag: 'سعر مرجعي' },
  { id: 8, brand: 'Vention', name: 'شاحن GaN بثلاثة منافذ 100W', price: '$79.39', color: 'C+C+A · 100W / 100W / 30W', category: 'CHARGERS', image: asset('vention-charger-100w.jpg'), tag: 'سعر مرجعي' },
  { id: 9, brand: 'Vention', name: 'كابل USB-C إلى USB-C بقدرة 100W', price: '$11.27 SGD', color: 'شحن سريع 5A · USB 2.0', category: 'CABLES', image: asset('vention-cable-100w.jpg'), tag: 'سعر مرجعي' },
  { id: 10, brand: 'Vention', name: 'محول سفر عالمي GaN بقدرة 65W', price: '$95.88 SGD', color: 'شحن عالمي للسفر', category: 'TRAVEL', image: asset('vention-adapter-65w.jpg'), tag: 'سعر مرجعي' },
];

const heroes: HeroSlide[] = [
  {
    image: asset('vention-powerbank-20k.jpg'),
    eyebrow: 'قائمة Vention المختارة',
    title: 'اشحن خطوتك القادمة.',
    body: 'عشرة منتجات مختارة لرف شحن عملي، جاهزة لطلب أسعار الجملة.',
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

function App() {
  const [slide, setSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % heroes.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  const submitEmail = () => {
    if (email.trim()) {
      setSubscribed(true);
      announce('تمت إضافتك إلى القائمة');
    }
  };

  return (
    <div className="site-shell">
      <div className="top-strip" data-testid="banner-promotion">
        الأسعار المعروضة مرجعية فقط · أسعار الجملة عند الطلب
        <button type="button" onClick={() => scrollTo('discover')} data-testid="button-promotion-details">تصفح المنتجات</button>
      </div>

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
              <span className="brand-lockup" lang="ar" dir="rtl">
                <span className="brand-name">القراحي الكترونيك</span>
                <span className="brand-subtitle">الوكيل الحصري لشركة Vention في اليمن</span>
              </span>
            </button>
            <div className="header-actions">
              <button className="header-action" type="button" onClick={() => setSearchOpen((current) => !current)} aria-label="بحث" data-testid="button-search">
                <Search /><span>بحث</span>
              </button>
              <button className="header-action" type="button" onClick={() => announce(`لديك ${favorites.length} منتجًا في المفضلة`)} aria-label="المفضلة" data-testid="button-wishlist">
                <Heart /><span>المفضلة</span>
                {favorites.length > 0 && <span className="count-bubble" data-testid="count-wishlist">{favorites.length}</span>}
              </button>
              <button className="header-action" type="button" onClick={() => setCartOpen(true)} aria-label="قائمة الطلب" data-testid="button-cart">
                <ShoppingBag /><span>قائمة الطلب</span>
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
            <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="nav-sale">اطلب عرض سعر</button>
          </nav>

          {mobileMenuOpen && (
            <nav className="mobile-nav" aria-label="تنقل الهاتف" data-testid="nav-mobile">
              <button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="mobile-nav-power-banks">باور بانك</button>
              <button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="mobile-nav-chargers">الشواحن</button>
              <button type="button" onClick={() => chooseCategory('CABLES')} data-testid="mobile-nav-cables">الكابلات</button>
              <button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="mobile-nav-travel">السفر والسيارة</button>
              <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="mobile-nav-quote">اطلب عرض سعر</button>
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
            <p>أربع فئات مختارة لرف شحن يغطي الاستخدام اليومي، المكتب، والسفر.</p>
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
            <p>منتجات Vention الأساسية بمواصفات واضحة، ومختارة لتسهيل التوريد وأسعار الجملة.</p>
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

        <section className="section" id="discover" data-testid="section-discover">
          <div className="section-header">
            <div>
              <span className="eyebrow">مختارة لرفك</span>
              <h2>قائمة Vention<br />المختارة.</h2>
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
                  <button className="text-link" type="button" onClick={() => addToCart(product)} data-testid={`button-add-product-${product.id}`}>أضف إلى القائمة</button>
                </div>
              </article>
            ))}
            {visibleProducts.length === 0 && <div className="empty-products" data-testid="empty-product-results">لا توجد منتجات مطابقة. جرّب SKU أو فئة أخرى.</div>}
          </div>
        </section>

        <section className="service-band" id="services" aria-label="خدمات المتجر" data-testid="section-services">
          <div className="service-item"><Truck /><span><strong>قائمة جاهزة للتوريد</strong><span>مصممة لاحتياجات السوق اليمني</span></span></div>
          <div className="service-item"><ShieldCheck /><span><strong>منتجات Vention أصلية</strong><span>SKU والضمان عند توفر المعلومات</span></span></div>
          <div className="service-item"><Sparkles /><span><strong>أسعار جملة عند الطلب</strong><span>الأسعار الحالية مرجعية فقط</span></span></div>
        </section>

        <section className="section newsletter" data-testid="section-newsletter">
          <h2>خلّ الطاقة<br />مستمرة.</h2>
          <div className="newsletter-right">
            <p>أدخل بريدك لاستلام قائمة المنتجات الجاهزة للتوريد وآخر تحديثاتنا.</p>
            {subscribed ? (
              <p data-testid="status-subscribed"><strong>تمت إضافتك إلى القائمة.</strong> تابع بريدك الإلكتروني.</p>
            ) : (
              <div className="email-form">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="بريدك الإلكتروني" aria-label="بريدك الإلكتروني" data-testid="input-newsletter-email" />
                 <button type="button" onClick={submitEmail} data-testid="button-newsletter-submit">اطلب القائمة <ArrowRight size={14} /></button>
              </div>
            )}
            <p className="signup-note">بإدخال بريدك، توافق على استلام التحديثات التسويقية.</p>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="footer-storefront">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand" lang="ar" dir="rtl">
              <span className="footer-brand-name">القراحي الكترونيك</span>
              <span className="footer-brand-subtitle">الوكيل الحصري لشركة Vention في اليمن</span>
              <p>منتجات Vention للشحن والطاقة، مختارة للتوريد داخل السوق اليمني.</p>
            </div>
            <div className="footer-col"><h4>تصفح</h4><button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="footer-power-banks">باور بانك</button><button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="footer-chargers">الشواحن</button><button type="button" onClick={() => chooseCategory('CABLES')} data-testid="footer-cables">الكابلات</button><button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="footer-travel">السفر والسيارة</button></div>
            <div className="footer-col"><h4>التوريد</h4><button type="button" onClick={() => announce('قائمة Vention جاهزة')} data-testid="footer-shortlist">قائمة Vention</button><button type="button" onClick={() => announce('تفاصيل الحد الأدنى للطلب قريبًا')} data-testid="footer-moq">الحد الأدنى للطلب</button><button type="button" onClick={() => announce('قائمة أسعار الجملة قريبًا')} data-testid="footer-pricing">أسعار الجملة</button></div>
            <div className="footer-col"><h4>المساعدة</h4><button type="button" onClick={() => scrollTo('services')} data-testid="footer-delivery">الشحن والجمارك</button><button type="button" onClick={() => announce('مواصفات المنتجات متاحة عند الطلب')} data-testid="footer-help">مواصفات المنتجات</button><button type="button" onClick={() => announce('نموذج التواصل قريبًا')} data-testid="footer-contact">اطلب عرض سعر</button></div>
            <div className="footer-col"><h4>تابعنا</h4><button type="button" onClick={() => announce('تم نسخ رابط Instagram')} data-testid="footer-instagram">Instagram</button><button type="button" onClick={() => announce('تم نسخ رابط TikTok')} data-testid="footer-tiktok">TikTok</button><button type="button" onClick={() => announce('تم نسخ رابط WhatsApp')} data-testid="footer-whatsapp">WhatsApp</button></div>
          </div>
          <div className="footer-bottom"><span>© 2026 القراحي الكترونيك. الوكيل الحصري لـ Vention في اليمن.</span><div className="footer-socials"><button type="button" onClick={() => announce('تم اختيار اليمن')} data-testid="button-country">اليمن <ChevronDown size={12} /></button><button type="button" onClick={() => announce('تم فتح اختيار اللغة')} data-testid="button-language">العربية <ChevronDown size={12} /></button></div></div>
        </div>
      </footer>

      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setCartOpen(false)} data-testid="overlay-cart">
            <aside className="cart-drawer" role="dialog" aria-label="قائمة طلب عرض السعر" onClick={(event) => event.stopPropagation()} data-testid="drawer-cart">
            <div className="drawer-header"><h2>قائمة الطلب <span>({cart.length})</span></h2><button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="إغلاق القائمة" data-testid="button-close-cart"><X size={16} /></button></div>
            {cart.length === 0 ? (
              <div className="cart-empty"><div><ShoppingBag size={29} strokeWidth={1.2} /><p>أضف المنتجات التي تريد طلب عرض سعر لها.</p><button className="button-dark" type="button" onClick={() => { setCartOpen(false); scrollTo('discover'); }} data-testid="button-start-shopping">تصفح المنتجات</button></div></div>
            ) : (
              <>
                <div>
                  {cart.map((product) => <div className="cart-item" key={product.id}><img src={product.image} alt={product.name} /><div className="cart-item-info"><button className="remove-item" type="button" onClick={() => setCart((current) => current.filter((item) => item.id !== product.id))} data-testid={`button-remove-cart-${product.id}`}>حذف</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>{product.price}</span></div></div>)}
                </div>
                  <div className="drawer-total"><span>المنتجات المختارة</span><span data-testid="text-cart-total">{cart.length}</span></div>
                  <button className="button-dark checkout-button" type="button" onClick={() => announce('نموذج طلب عرض السعر جاهز للربط')} data-testid="button-checkout">اطلب عرض سعر للجملة</button>
              </>
            )}
          </aside>
        </div>
      )}
      {toast && <div className="toast-message" role="status" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

export default App;