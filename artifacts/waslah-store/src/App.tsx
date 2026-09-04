import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  BatteryCharging,
  Check,
  ClipboardList,
  Globe2,
  Menu,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';

type Category = 'الكل' | 'باور بانك' | 'شواحن GaN' | 'كابلات' | 'سفر';

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, 'الكل'>;
  image: string;
  output: string;
  ports: string;
  capacity?: string;
  reference: string;
  sku?: string;
  warranty?: string;
  badge?: string;
};

const products: Product[] = [
  {
    id: 1,
    name: 'باور بانك 20,000mAh / 22.5W',
    category: 'باور بانك',
    image: '/waslah/images/waslah-powerbank.png',
    output: '22.5W',
    ports: 'USB-C + USB-A',
    capacity: '20,000mAh',
    reference: '$28.09',
    sku: 'XGYP0-40-TY',
    warranty: '12 شهر',
    badge: 'اختيار أساسي',
  },
  {
    id: 2,
    name: 'باور بانك 10,000mAh / 22.5W',
    category: 'باور بانك',
    image: '/waslah/images/waslah-powerbank.png',
    output: '22.5W',
    ports: 'كابل مدمج',
    capacity: '10,000mAh',
    reference: 'حوالي $24.18 SGD',
    badge: 'طلب متكرر',
  },
  {
    id: 3,
    name: 'باور بانك 10,000mAh / 22.5W',
    category: 'باور بانك',
    image: '/waslah/images/waslah-powerbank.png',
    output: '22.5W',
    ports: 'USB-C + Lightning مدمجان',
    capacity: '10,000mAh',
    reference: 'حوالي $24.82 SGD',
  },
  {
    id: 4,
    name: 'شاحن GaN ثنائي المنفذ 30W',
    category: 'شواحن GaN',
    image: '/waslah/images/waslah-charger.png',
    output: '30W',
    ports: 'USB-C + USB-A',
    reference: '$11.69',
    badge: 'سعر مرجعي منخفض',
  },
  {
    id: 5,
    name: 'عدة شحن GaN بقدرة 30W',
    category: 'شواحن GaN',
    image: '/waslah/images/waslah-charger.png',
    output: '30W',
    ports: 'USB-C + كابل USB-C إلى USB-C',
    reference: '$15.90',
  },
  {
    id: 6,
    name: 'شاحن GaN ثلاثي المنافذ 65W',
    category: 'شواحن GaN',
    image: '/waslah/images/waslah-charger.png',
    output: '65W',
    ports: 'C + C + A',
    reference: '$37.59',
    badge: 'للعمل والسفر',
  },
  {
    id: 7,
    name: 'شاحن GaN ثلاثي المنافذ 70W',
    category: 'شواحن GaN',
    image: '/waslah/images/waslah-charger.png',
    output: '70W',
    ports: 'C + C + A',
    reference: '$39.90',
  },
  {
    id: 8,
    name: 'شاحن GaN ثلاثي المنافذ 100W',
    category: 'شواحن GaN',
    image: '/waslah/images/waslah-charger.png',
    output: '100W',
    ports: 'C + C + A',
    reference: '$79.39',
    badge: 'فئة عالية القدرة',
  },
  {
    id: 9,
    name: 'كابل USB-C إلى USB-C PD بقدرة 100W',
    category: 'كابلات',
    image: '/waslah/images/waslah-charger.png',
    output: '100W PD',
    ports: 'USB-C إلى USB-C',
    reference: '$11.27 SGD',
  },
  {
    id: 10,
    name: 'محول سفر عالمي GaN بقدرة 65W',
    category: 'سفر',
    image: '/waslah/images/waslah-adapter.png',
    output: '65W',
    ports: 'محول عالمي + USB-C',
    reference: '$95.88 SGD',
    badge: 'للمسافرين',
  },
];

const categories: Category[] = ['الكل', 'باور بانك', 'شواحن GaN', 'كابلات', 'سفر'];
const queryClient = new QueryClient();

function ProductCard({
  product,
  shortlisted,
  compared,
  onShortlist,
  onCompare,
}: {
  product: Product;
  shortlisted: boolean;
  compared: boolean;
  onShortlist: () => void;
  onCompare: () => void;
}) {
  return (
    <article className="product-card fade-up" data-testid={`card-product-${product.id}`}>
      <div className="product-visual">
        {product.badge && <span className="tag">{product.badge}</span>}
        <img src={product.image} alt={product.name} data-testid={`img-product-${product.id}`} />
      </div>
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        <h3 className="product-title" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <dl className="spec-list">
          {product.capacity && (
            <div className="spec-line">
              <dt>السعة</dt>
              <dd className="font-latin">{product.capacity}</dd>
            </div>
          )}
          <div className="spec-line">
            <dt>القدرة</dt>
            <dd className="font-latin">{product.output}</dd>
          </div>
          <div className="spec-line">
            <dt>المنافذ</dt>
            <dd>{product.ports}</dd>
          </div>
          {product.warranty && (
            <div className="spec-line">
              <dt>الضمان</dt>
              <dd>{product.warranty}</dd>
            </div>
          )}
          {product.sku && (
            <div className="spec-line">
              <dt>SKU</dt>
              <dd className="font-mono" dir="ltr">{product.sku}</dd>
            </div>
          )}
        </dl>
        <div className="reference-price">
          <span>مرجع التجزئة فقط</span>
          <strong dir="ltr">{product.reference}</strong>
        </div>
        <div className="product-actions">
          <button
            className="quote-button"
            onClick={onShortlist}
            data-testid={`button-quote-product-${product.id}`}
          >
            {shortlisted ? 'أضيف إلى القائمة' : 'أضف لطلب عرض السعر'}
          </button>
          <button
            className={`compare-button ${compared ? 'active' : ''}`}
            onClick={onCompare}
            aria-label={compared ? 'إزالة من المقارنة' : 'إضافة للمقارنة'}
            data-testid={`button-compare-product-${product.id}`}
          >
            {compared ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </article>
  );
}

function ShortlistDrawer({
  items,
  onClose,
  onRemove,
  onRequest,
}: {
  items: Product[];
  onClose: () => void;
  onRemove: (id: number) => void;
  onRequest: () => void;
}) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} data-testid="button-close-drawer-backdrop" />
      <aside className="shortlist-drawer" aria-label="قائمة طلب عرض السعر" data-testid="drawer-shortlist">
        <div className="drawer-head">
          <div>
            <h2>قائمة عرض السعر</h2>
            <p>{items.length} منتجات مختارة من قائمة Waslah</p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="إغلاق" data-testid="button-close-drawer">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-list">
          {items.length === 0 ? (
            <div className="empty-drawer">
              <ClipboardList size={28} />
              <p>لم تختر منتجات بعد.<br />أضف ما تريد تسعيره بالجملة من البطاقات.</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="drawer-item" key={item.id} data-testid={`row-shortlist-${item.id}`}>
                <img src={item.image} alt="" />
                <div>
                  <h3>{item.name}</h3>
                  <p dir={item.sku ? 'ltr' : 'rtl'}>{item.sku || 'SKU غير متوفر في القائمة'}</p>
                </div>
                <button
                  className="remove-item"
                  onClick={() => onRemove(item.id)}
                  aria-label={`إزالة ${item.name}`}
                  data-testid={`button-remove-shortlist-${item.id}`}
                >
                  <X size={15} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="drawer-foot">
          <div className="drawer-callout">
            سعر الجملة غير متاح بعد. أرسل القائمة لتحصل على عرض Vention، مع تفاصيل MOQ والشحن إلى اليمن.
          </div>
          <button
            className="button-primary"
            onClick={onRequest}
            disabled={items.length === 0}
            style={{ opacity: items.length === 0 ? 0.45 : 1 }}
            data-testid="button-submit-quote-request"
          >
            <ArrowUpLeft size={16} />
            طلب عرض سعر للقائمة
          </button>
        </div>
      </aside>
    </>
  );
}

function Home() {
  const [category, setCategory] = useState<Category>('الكل');
  const [search, setSearch] = useState('');
  const [shortlist, setShortlist] = useState<number[]>([]);
  const [comparison, setComparison] = useState<number[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'الكل' || product.category === category;
      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.ports.toLowerCase().includes(normalized) ||
        product.output.toLowerCase().includes(normalized) ||
        product.sku?.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const shortlistProducts = products.filter((product) => shortlist.includes(product.id));
  const comparisonProducts = products.filter((product) => comparison.includes(product.id));

  const toggleShortlist = (id: number) => {
    setShortlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setDrawerOpen(true);
    setRequestSent(false);
  };

  const toggleComparison = (id: number) => {
    setComparison((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const submitRequest = () => {
    if (!shortlist.length) return;
    setRequestSent(true);
  };

  return (
    <div className="waslah-app" dir="rtl">
      <div className="topbar">
        <div className="container-wide topbar-inner">
          <span>قائمة توريد مركزة لإكسسوارات الشحن إلى اليمن</span>
          <span className="font-mono" dir="ltr">VENTION / WASLAH 2024</span>
        </div>
      </div>

      <header className={`site-header ${menuOpen ? 'menu-expanded' : ''}`}>
        <div className="container-wide header-main">
          <a className="brand" href="#top" data-testid="link-brand">
            <span className="brand-mark">و</span>
            <span>
              <span className="brand-word">Waslah</span>
              <span className="brand-note">حلول شحن عملية</span>
            </span>
          </a>
          <div className="search-wrap">
            <Search size={17} />
            <input
              className="search-input"
              type="search"
              placeholder="ابحث عن قدرة، منفذ، أو SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              data-testid="input-search-products"
            />
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="فتح القائمة"
              aria-expanded={menuOpen}
              data-testid="button-mobile-menu"
            >
              <Menu size={18} />
            </button>
            <button
              className="icon-button"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح قائمة عرض السعر"
              data-testid="button-open-shortlist"
            >
              <ShoppingBag size={18} />
              {shortlist.length > 0 && <span className="count-dot">{shortlist.length}</span>}
            </button>
          </div>
        </div>
        <nav className="container-wide nav-row" aria-label="التنقل الرئيسي">
          <a href="#products" data-testid="link-products">المنتجات</a>
          <a href="#sourcing" data-testid="link-sourcing">كيف نشتري</a>
          <a href="#costing" data-testid="link-costing">خطوات التسعير</a>
          <a href="#about" data-testid="link-about">عن Waslah</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container-wide hero-grid">
            <div className="fade-up">
              <span className="eyebrow">SHORTLIST / CHARGING ACCESSORIES</span>
              <h1>اختيارات شحن<br /><em>تصلح للسوق.</em></h1>
              <p className="hero-copy">
                عشرة منتجات Vention منتقاة بعناية: باور بانك، شواحن GaN، كابلات، وحلول سفر. اختر ما يناسبك، ثم اطلب عرض سعر واضح للتوريد إلى اليمن.
              </p>
              <div className="hero-actions">
                <a className="button-primary" href="#products" data-testid="link-browse-products">
                  تصفح القائمة <ArrowLeft size={16} />
                </a>
                <button className="button-ghost" onClick={() => setDrawerOpen(true)} data-testid="button-hero-quote">
                  <ClipboardList size={16} /> جهز قائمة عرض سعر
                </button>
              </div>
              <div className="hero-note">
                <ShieldCheck size={15} /> مرجع التجزئة ظاهر للمقارنة فقط — سعر الجملة بعد الاقتباس
              </div>
            </div>
            <div className="hero-art fade-up fade-up-delay-1">
              <span className="art-label">WASLAH / 01—10</span>
              <img className="hero-image" src="/waslah/images/waslah-hero.png" alt="مجموعة إكسسوارات شحن" data-testid="img-hero-products" />
              <span className="art-spec">USB-C / GaN / PD</span>
            </div>
          </div>
        </section>

        <div className="trust-strip">
          <div className="container-wide trust-items">
            <span className="trust-item"><BadgeCheck size={16} /> منتجات محددة لا سوق عام</span>
            <span className="trust-item"><Globe2 size={16} /> توريد موجه إلى اليمن</span>
            <span className="trust-item"><ShieldCheck size={16} /> SKU ومواصفات قابلة للمراجعة</span>
            <span className="trust-item"><PackageCheck size={16} /> الضمان مذكور حيث توفر</span>
          </div>
        </div>

        <section className="section" id="products">
          <div className="container-wide">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE SHORTLIST</span>
                <h2>قائمة المنتجات</h2>
              </div>
              <p>قارن المواصفات أولاً. السعر الظاهر هو مرجع تجزئة فقط وليس عرضاً بالجملة.</p>
            </div>
            <div className="category-tabs" role="tablist" aria-label="تصفية حسب الفئة">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`category-tab ${category === item ? 'active' : ''}`}
                  onClick={() => setCategory(item)}
                  role="tab"
                  aria-selected={category === item}
                  data-testid={`button-filter-${item}`}
                >
                  {item}
                </button>
              ))}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginInlineStart: 'auto', color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
                <SlidersHorizontal size={14} /> {filteredProducts.length} منتجات
              </span>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    shortlisted={shortlist.includes(product.id)}
                    compared={comparison.includes(product.id)}
                    onShortlist={() => toggleShortlist(product.id)}
                    onCompare={() => toggleComparison(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-drawer" style={{ minHeight: 220 }}>
                <Search size={28} />
                <p>لم نجد منتجاً يطابق بحثك.<br />جرّب 65W أو USB-C أو امسح البحث.</p>
                <button className="button-ghost" onClick={() => setSearch('')} data-testid="button-clear-search">مسح البحث</button>
              </div>
            )}
          </div>
        </section>

        {comparisonProducts.length > 0 && (
          <section className="container-wide" style={{ paddingBottom: 20 }} aria-label="مقارنة المنتجات">
            <div style={{ background: 'hsl(var(--secondary))', borderRadius: 16, padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>مقارنة سريعة</span>
              {comparisonProducts.map((item) => (
                <span key={item.id} style={{ display: 'inline-flex', gap: 7, alignItems: 'center', background: 'hsl(var(--card))', borderRadius: 8, padding: '7px 9px', fontSize: 11 }}>
                  {item.output} · {item.category}
                  <button onClick={() => toggleComparison(item.id)} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }} aria-label="إزالة من المقارنة" data-testid={`button-remove-compare-${item.id}`}><X size={13} /></button>
                </span>
              ))}
              <span style={{ marginInlineStart: 'auto', color: 'hsl(var(--muted-foreground))', fontSize: 10 }}>حتى 3 منتجات</span>
            </div>
          </section>
        )}

        <section className="logic-section" id="sourcing">
          <div className="container-wide logic-grid">
            <div>
              <span className="eyebrow">SOURCE WITH CLARITY</span>
              <h2>قبل أن نضع سعراً محلياً، نثبت تكلفة الوصول.</h2>
              <p>Waslah يفصل بين ما نعرفه الآن وما يحتاج إلى عرض من Vention. هذا يحمي قرار الشراء من أرقام تبدو دقيقة وهي ليست كذلك.</p>
            </div>
            <div className="logic-points">
              <div className="logic-point">
                <span className="logic-point-number">01</span>
                <div><h3>مرجع التجزئة</h3><p>السعر الموجود على كل بطاقة يساعدك على قراءة تموضع المنتج فقط. ليس Wholesale ولا وعداً بسعر البيع.</p></div>
              </div>
              <div className="logic-point">
                <span className="logic-point-number">02</span>
                <div><h3>عرض Vention أولاً</h3><p>أرسل المنتجات المطلوبة، وسنطلب سعر الجملة وشروط MOQ لكل SKU بدلاً من تخمينها.</p></div>
              </div>
              <div className="logic-point">
                <span className="logic-point-number">03</span>
                <div><h3>ثم تكلفة اليمن</h3><p>بعد العرض نضيف الشحن، الجمارك، وأي مصاريف وصول قبل تحديد سعر البيع المحلي.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="costing">
          <div className="container-wide">
            <div className="section-heading">
              <div>
                <span className="eyebrow">NEXT COSTING STEPS</span>
                <h2>ما الذي سيحدث بعد الطلب؟</h2>
              </div>
              <p>لا توجد مفاجآت مخفية في القائمة. كل رقم غير متوفر يبقى معلّقاً حتى يصل مصدره.</p>
            </div>
            <div className="guide-grid">
              <div className="guide-card"><ClipboardList size={19} /><h3>1. القائمة</h3><p>اختر المنتجات والكميات التي تريد إدراجها في طلب العرض.</p></div>
              <div className="guide-card"><PackageCheck size={19} /><h3>2. MOQ</h3><p>نثبت الحد الأدنى للطلب لكل منتج مباشرة مع Vention.</p></div>
              <div className="guide-card"><Truck size={19} /><h3>3. الشحن والجمارك</h3><p>نضيف مسار الشحن إلى اليمن والتخليص الجمركي إلى التكلفة.</p></div>
              <div className="guide-card"><BatteryCharging size={19} /><h3>4. سعر البيع</h3><p>نحسب سعر البيع المحلي بعد معرفة التكلفة الواصلة الفعلية.</p></div>
            </div>
          </div>
        </section>

        <section className="section" id="about" style={{ paddingTop: 0 }}>
          <div className="container-wide" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 28, display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <span className="eyebrow">A PRACTICAL START</span>
              <h2 style={{ fontSize: 22, margin: '8px 0 0', letterSpacing: '-.04em' }}>ابدأ بأقل عدد من القرارات.</h2>
            </div>
            <button className="button-primary" onClick={() => setDrawerOpen(true)} data-testid="button-bottom-quote">
              فتح قائمة عرض السعر <ArrowUpLeft size={16} />
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container-wide footer-inner">
          <div className="brand">
            <span className="brand-mark">و</span>
            <span className="brand-word">Waslah</span>
          </div>
          <small>مرجع التجزئة للبحث فقط. أسعار الجملة، MOQ، الشحن، الجمارك وسعر البيع المحلي قيد التسعير.</small>
        </div>
      </footer>

      {drawerOpen && (
        <ShortlistDrawer
          items={shortlistProducts}
          onClose={() => setDrawerOpen(false)}
          onRemove={(id) => setShortlist((current) => current.filter((item) => item !== id))}
          onRequest={submitRequest}
        />
      )}
      {requestSent && drawerOpen && (
        <div style={{ position: 'fixed', zIndex: 60, bottom: 22, insetInlineStart: 22, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderRadius: 12, padding: '13px 17px', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }} data-testid="status-quote-request">
          <Check size={16} /> تم تجهيز طلبك — سيتبعك عرض Vention بعد المراجعة.
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={Home} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;