import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Heart, Menu, Search, ShoppingBag, X, ChevronDown, ChevronLeft, PackageSearch, MessageCircle, Tags, Truck, CircleHelp, BookOpen, ShieldCheck, RotateCcw, Mail } from 'lucide-react';
import { useStore } from '@/lib/store';

export function StoreShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const { catalog, cartCount, favorites, cartProducts } = useStore();
  const categories = useMemo(() => Array.from(new Map((catalog?.products || [])
    .filter((product) => product.category)
    .map((product) => [product.category!.slug, product.category!]))
    .values()), [catalog]);
  const featuredCategories = categories.slice(0, 3);
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
          <Link href="/search" className="icon-action" aria-label="البحث" data-testid="link-search"><Search size={20}/></Link>
          <Link href="/orders" className="icon-action orders-action" aria-label="تتبع الطلب" data-testid="link-orders"><PackageSearch size={20}/></Link>
          <Link href="/cart" className="icon-action cart-action" aria-label="السلة" data-testid="link-cart"><ShoppingBag size={20}/>{cartCount > 0 && <b>{cartCount}</b>}</Link>
          <Link href="/search?view=favorites" className="icon-action favorite-action" aria-label="المفضلة" data-testid="link-favorites"><Heart size={20}/>{favorites.length > 0 && <b>{favorites.length}</b>}</Link>
        </div>
      </div>
       <div className="container search-ribbon"><Link href="/search" className="search-cta" data-testid="link-search-ribbon"><Search size={18}/><span>ابحث عن شاحن، كابل، سماعة...</span><kbd>⌘ K</kbd></Link><span className="ribbon-note">بيانات الكتالوج • أسعار واضحة • خدمة محلية</span></div>
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
             <Link href="/lab" onClick={() => setMobileOpen(false)} className="drawer-menu-link" data-testid="link-mobile-lab"><span className="drawer-menu-icon"><ShieldCheck size={17}/></span><span>مركز المواصفات</span><ChevronLeft size={16}/></Link>
           </section>
         </div>
         <div className="drawer-foot"><MessageCircle size={16}/><span>تحتاج مساعدة؟ <Link href="/contact" onClick={() => setMobileOpen(false)}>تواصل معنا</Link></span></div>
       </aside>
     </div>}
     <main className="page-main">{children}</main>
      {location !== '/cart' && location !== '/checkout' && <FloatingCartSummary total={cartSubtotal} count={cartCount} />}
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