import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Heart, Menu, Search, ShoppingBag, X, ChevronDown, ChevronLeft, PackageSearch, MessageCircle, Tags, Truck, CircleHelp, BookOpen, ShieldCheck, RotateCcw, Mail, MapPin, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { productPath } from '@/lib/store-routes';
import { seoKeywordClusters } from '@/lib/seo-keywords';

export function StoreShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [location] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { catalog, cartCount, favorites, cartProducts, currency, setCurrencyCode } = useStore();
  const { formatPrice } = useStore();
  const categories = useMemo(() => catalog?.categories || [], [catalog]);
  const featuredCategories = categories;
  const navItems = useMemo(() => [
    { label: 'المنتجات', href: '/search' },
    ...featuredCategories.map((category) => ({ label: category.name, href: `/category/${category.slug}` })),
    { label: 'العلامات التجارية', href: '/search?view=brands' },
    { label: 'عن CABL', href: '/about' },
    { label: 'المساعدة', href: '/faq' },
  ], [featuredCategories]);
  useEffect(() => {
    const titles: Record<string, string> = {
      '/search': 'كتالوج المنتجات | CABL',
      '/cart': 'سلة المشتريات | CABL',
      '/checkout': 'إتمام الشراء | CABL',
      '/orders': 'تتبع الطلبات | CABL',
    };
    const route = location.split('?')[0];
    if (titles[route]) document.title = titles[route];
  }, [location]);
  useEffect(() => {
    const [route, queryString] = location.split('?');
    if (route === '/search') setSearchTerm(new URLSearchParams(queryString || '').get('q') || '');
  }, [location]);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);
  const cartSubtotal = useMemo(() => cartProducts.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.regularPrice) * item.quantity, 0), [cartProducts]);
  const liveSearchResults = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('ar');
    if (!normalized) return [];
    return (catalog?.products || []).filter((product) => `${product.productName} ${product.brand} ${product.shortDescription || ''}`.toLocaleLowerCase('ar').includes(normalized)).slice(0, 6);
  }, [catalog, searchTerm]);
  const peopleAlsoSearchClusters = useMemo(() => {
    const route = location.split('?')[0];
    const product = (catalog?.products || []).find((item) => productPath(item) === route);
    const categorySlug = route.startsWith('/category/')
      ? route.slice('/category/'.length)
      : product?.category?.slug;
    const publicCategoryMap: Record<string, string> = {
      cables: 'charging-cables',
      'hubs-adapters': 'phone-accessories',
      'car-accessories': 'travel-adapters',
    };
    const current = seoKeywordClusters.find((cluster) => cluster.slug === route.slice('/guides/'.length))
      || seoKeywordClusters.find((cluster) => cluster.categorySlug === (publicCategoryMap[categorySlug || ''] || categorySlug));
    return current
      ? [current, ...seoKeywordClusters.filter((cluster) => cluster.slug !== current.slug)].slice(0, 4)
      : seoKeywordClusters.slice(0, 4);
  }, [catalog, location]);
  const hidePeopleAlsoSearch = ['/cart', '/checkout', '/orders'].some((path) => location === path || location.startsWith(`${path}/`));
  return <div dir="rtl" className="min-h-[100dvh]">
     <div className="top-strip"><div className="container top-strip-inner"><div className="top-announcement"><span>الوكيل الحصري لشركة Baseus في اليمن</span><a href="https://wa.me/967771106977" target="_blank" rel="noreferrer" className="top-phone" dir="ltr" aria-label="تواصل معنا عبر واتساب على 771106977" data-testid="link-whatsapp"><MessageCircle size={13}/> 771106977</a></div><Link href="/orders" className="phone-link" data-testid="link-track-order"><PackageSearch size={13}/> تتبع طلبك</Link></div></div>
     <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-main">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة" data-testid="button-open-menu"><Menu size={23}/></button>
        <Link href="/" className="brand-mark" data-testid="link-home"><span className="brand-cabl">CABL</span><span className="brand-dot">.</span><small>طاقة يومك</small></Link>
       <nav className="desktop-nav">{navItems.map((item) => {
         const route = location.split('?')[0];
         const isActive = item.href === '/search'
           ? route === '/search'
           : item.href === '/' ? route === '/' : route === item.href || route.startsWith(`${item.href}/`);
         return <Link href={item.href} key={item.href} className={`nav-link${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'page' : undefined} data-testid={`link-nav-${item.label}`}>{item.label}{item.label === 'العلامات التجارية' && <ChevronDown size={14}/>}</Link>;
       })}</nav>
        <div className="header-actions">
            {catalog?.currencies.length ? <label className="currency-switcher"><select value={currency?.code || 'YER'} onChange={(event) => setCurrencyCode(event.target.value)} aria-label="اختيار العملة" data-testid="select-header-currency">{catalog.currencies.map((option) => <option value={option.code} key={option.code}>{option.name}</option>)}</select></label> : null}
          <Link href="/orders" className="icon-action orders-action" aria-label="تتبع الطلب" data-testid="link-orders"><PackageSearch size={20}/></Link>
          <Link href="/cart" className="icon-action cart-action" aria-label="السلة" data-testid="link-cart"><ShoppingBag size={20}/>{cartCount > 0 && <b>{cartCount}</b>}</Link>
          <Link href="/search?view=favorites" className="icon-action favorite-action" aria-label="المفضلة" data-testid="link-favorites"><Heart size={20}/>{favorites.length > 0 && <b>{favorites.length}</b>}</Link>
        </div>
      </div>
        <div className="container search-ribbon" id="header-search-ribbon"><div className="header-search-wrap"><form className="header-search-form" onSubmit={(event) => event.preventDefault()}><Search size={17}/><input ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="ابحث عن شاحن، كابل، سماعة..." aria-label="بحث المنتجات من الهيدر" data-testid="input-header-search"/>{searchTerm && <button type="button" className="header-search-close" onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }} aria-label="مسح البحث" data-testid="button-clear-header-search"><X size={16}/></button>}</form>{searchTerm.trim() && <div className="header-search-results" role="listbox" aria-label="نتائج البحث المباشرة">{liveSearchResults.length ? liveSearchResults.map((product) => <Link href={productPath(product)} className="header-search-result" key={product.id} onClick={() => setSearchTerm('')} role="option" data-testid={`link-live-search-${product.id}`}><img src={product.images?.[0]} alt="" /><span><strong>{product.productName}</strong><small>{product.brand}</small></span><b>{formatPrice(product.discountPrice ?? product.regularPrice)}</b></Link>) : <div className="header-search-empty">لا توجد منتجات مطابقة حالياً.</div>}</div>}</div><span className="ribbon-note">نتائج مباشرة من كتالوج CABL</span></div>
    </header>
     {mobileOpen && <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}>
       <aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="قائمة CABL" onClick={(event) => event.stopPropagation()}>
         <div className="drawer-head">
           <div><span className="brand-cabl">CABL<span className="brand-dot">.</span></span><small>متجر التقنية اليومية</small></div>
           <button onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة" title="إغلاق القائمة" data-testid="button-close-menu"><X/></button>
         </div>
         <Link href="/search" onClick={() => setMobileOpen(false)} className="drawer-search-link" data-testid="link-mobile-search"><Search size={17}/><span>ابحث عن منتج أو علامة تجارية</span><ChevronLeft size={16}/></Link>
         <div className="drawer-scroll">
           <section className="drawer-section">
             <p className="drawer-section-title">تسوّق</p>
             <Link href="/search" onClick={() => setMobileOpen(false)} className="drawer-menu-link drawer-menu-link-primary" data-testid="link-mobile-products"><span className="drawer-menu-icon"><ShoppingBag size={17}/></span><span>كل المنتجات</span><ChevronLeft size={16}/></Link>
             {categories.map((category) => <Link href={`/category/${category.slug}`} onClick={() => setMobileOpen(false)} className="drawer-menu-link" key={category.slug} data-testid={`link-mobile-category-${category.slug}`}><span className="drawer-menu-icon"><Tags size={16}/></span><span>{category.name}</span><ChevronLeft size={16}/></Link>)}
             <Link href="/search?view=brands" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-brands"><span className="drawer-menu-icon"><Tags size={16}/></span><span>العلامات التجارية</span><ChevronLeft size={16}/></Link>
           </section>
           <section className="drawer-section">
             <p className="drawer-section-title">خدماتك</p>
             <Link href="/search?view=favorites" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-favorites"><span className="drawer-menu-icon"><Heart size={17}/></span><span>المفضلة{favorites.length > 0 && <b className="drawer-count">{favorites.length}</b>}</span><ChevronLeft size={16}/></Link>
             <Link href="/orders" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-orders"><span className="drawer-menu-icon"><PackageSearch size={17}/></span><span>تتبع طلب سابق</span><ChevronLeft size={16}/></Link>
             <Link href="/shipping" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-shipping"><span className="drawer-menu-icon"><Truck size={17}/></span><span>الشحن والتوصيل</span><ChevronLeft size={16}/></Link>
           </section>
           <section className="drawer-section">
             <p className="drawer-section-title">عن CABL والمساعدة</p>
             <Link href="/about" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-about"><span className="drawer-menu-icon"><BookOpen size={17}/></span><span>عن CABL</span><ChevronLeft size={16}/></Link>
             <Link href="/faq" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-faq"><span className="drawer-menu-icon"><CircleHelp size={17}/></span><span>الأسئلة الشائعة</span><ChevronLeft size={16}/></Link>
             <Link href="/return-policy" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-returns"><span className="drawer-menu-icon"><RotateCcw size={17}/></span><span>الإرجاع والاستبدال</span><ChevronLeft size={16}/></Link>
             <Link href="/contact" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-contact"><span className="drawer-menu-icon"><Mail size={17}/></span><span>تواصل معنا</span><ChevronLeft size={16}/></Link>
             <Link href="/blog/best-power-bank-yemen" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-guide"><span className="drawer-menu-icon"><BookOpen size={17}/></span><span>دليل الشراء</span><ChevronLeft size={16}/></Link>
             <Link href="/lab" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-lab"><span className="drawer-menu-icon"><ShieldCheck size={17}/></span><span>مركز المواصفات</span><ChevronLeft size={16}/></Link>
             <Link href="/verify" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-verify"><span className="drawer-menu-icon"><ShieldCheck size={17}/></span><span>التحقق من الضمان</span><ChevronLeft size={16}/></Link>
             <Link href="/solutions/slow-car-charging" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-solution"><span className="drawer-menu-icon"><Zap size={17}/></span><span>حلول الشحن اليومية</span><ChevronLeft size={16}/></Link>
             <Link href="/locations/yemen" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-location"><span className="drawer-menu-icon"><MapPin size={17}/></span><span>نطاق التوصيل في اليمن</span><ChevronLeft size={16}/></Link>
           </section>
         </div>
         <div className="drawer-foot"><MessageCircle size={16}/><span>تحتاج مساعدة؟ <Link href="/contact" onClick={() => setMobileOpen(false)}>تواصل معنا</Link></span></div>
       </aside>
     </div>}
     <main className="page-main">{children}</main>
      {location !== '/cart' && location !== '/checkout' && <FloatingCartSummary total={cartSubtotal} count={cartCount} />}
       {!hidePeopleAlsoSearch && <section className="people-search-section" aria-labelledby="people-also-search-title">
         <div className="container">
           <div className="people-search-heading">
             <div><span className="eyebrow">بحث مرتبط</span><h2 id="people-also-search-title">الناس تبحث أيضاً عن</h2></div>
             <p>موضوعات قريبة تساعدك تصل إلى القسم أو دليل الشراء المناسب من الكتالوج.</p>
           </div>
           <div className="people-search-grid">
             {peopleAlsoSearchClusters.map((cluster) => <Link href={`/guides/${cluster.slug}`} className="people-search-card" key={cluster.slug}>
               <strong>{cluster.primaryTerm}</strong>
               <span>{cluster.searchThemes.slice(0, 3).join(' · ')}</span>
               <small>افتح الدليل <ArrowLeft size={13} /></small>
             </Link>)}
           </div>
         </div>
       </section>}
      <footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><span className="brand-cabl light">CABL<span className="brand-dot">.</span></span><p>الأشياء الصغيرة التي تجعل يومك أسهل. بيانات كتالوج واضحة وخطوات شراء مرتبطة بالطلب.</p><Link href="/orders" data-testid="link-footer-phone"><PackageSearch size={15}/> تتبع طلبك</Link></div><div><h3>تسوق</h3><Link href="/search" data-testid="link-footer-all">كل المنتجات</Link>{categories.map((category) => <Link href={`/category/${category.slug}`} key={category.slug} data-testid={`link-footer-category-${category.slug}`}>{category.name}</Link>)}</div><div><h3>خدمة العملاء</h3><Link href="/orders" data-testid="link-footer-orders">تتبع طلبك</Link><Link href="/shipping">الشحن والتوصيل</Link><Link href="/return-policy">الإرجاع والاستبدال</Link><Link href="/faq">الأسئلة الشائعة</Link><Link href="/contact">تواصل معنا</Link></div><div><h3>اعرف أكثر</h3><Link href="/about">عن CABL</Link><Link href="/blog/best-power-bank-yemen">دليل الشراء</Link><Link href="/lab">مركز المواصفات</Link><Link href="/verify">التحقق من الضمان</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} CABL اليمن</span><span>الدفع الآمن يبدأ من معلومات واضحة</span></div></footer>
  </div>;
}

function FloatingCartSummary({ total, count }: { total: number; count: number }) {
  const { formatPrice } = useStore();
  if (count < 1) return null;
  return <aside className="floating-cart-summary" role="status" aria-live="polite">
    <div className="floating-cart-copy"><span className="floating-cart-label">السلة الحالية</span><strong>{formatPrice(total)}</strong><small>{count} {count === 1 ? 'منتج' : 'منتجات'}</small></div>
    <Link href="/cart" className="button button-primary floating-cart-button" data-testid="link-floating-cart">اذهب إلى السلة <ArrowLeft size={15} /></Link>
  </aside>;
}