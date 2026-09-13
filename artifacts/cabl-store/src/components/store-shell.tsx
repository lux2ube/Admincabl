import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Heart, Menu, Search, ShoppingBag, X, ChevronDown, ShieldCheck, Truck, PackageSearch, Phone } from 'lucide-react';
import { useStore } from '@/lib/store';

export function StoreShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const { catalog, cartCount, favorites } = useStore();
  const categories = useMemo(() => Array.from(new Map((catalog?.products || [])
    .filter((product) => product.category)
    .map((product) => [product.category!.slug, product.category!]))
    .values()).slice(0, 3), [catalog]);
  const navItems = useMemo(() => [
    { label: 'المنتجات', href: '/search' },
    ...categories.map((category) => ({ label: category.name, href: `/category/${category.slug}` })),
    { label: 'العلامات التجارية', href: '/search?view=brands' },
    { label: 'عن CABL', href: '/about' },
    { label: 'المساعدة', href: '/faq' },
  ], [categories]);
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
  return <div dir="rtl" className="min-h-[100dvh]">
     <div className="top-strip"><div className="container top-strip-inner"><div className="top-announcement"><span><ShieldCheck size={13}/> الوكيل الحصري لشركة Baseus في اليمن</span><a href="tel:771106977" className="top-phone" dir="ltr" aria-label="اتصل بنا على 771106977" data-testid="link-phone"><Phone size={13}/> 771106977</a></div><Link href="/orders" className="phone-link" data-testid="link-track-order"><PackageSearch size={13}/> تتبع طلبك</Link></div></div>
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
     {mobileOpen && <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}><aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="قائمة CABL" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><span className="brand-cabl">CABL<span className="brand-dot">.</span></span><button onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة" title="إغلاق القائمة" data-testid="button-close-menu"><X/></button></div><div className="drawer-links">{navItems.map((item) => <Link href={item.href} onClick={() => setMobileOpen(false)} key={item.href} data-testid={`link-mobile-${item.label}`}>{item.label}<ChevronDown size={15}/></Link>)}<Link href="/search?view=favorites" onClick={() => setMobileOpen(false)} key="favorites" data-testid="link-mobile-favorites">المفضلة<Heart size={16}/></Link><Link href="/orders" onClick={() => setMobileOpen(false)} key="orders" data-testid="link-mobile-orders">تتبع طلب سابق<PackageSearch size={16}/></Link></div><div className="drawer-foot">تحتاج مساعدة؟ <Link href="/orders" onClick={() => setMobileOpen(false)}>راجع طلبك</Link></div></aside></div>}
     <main className="page-main">{children}</main>
      <footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><span className="brand-cabl light">CABL<span className="brand-dot">.</span></span><p>الأشياء الصغيرة التي تجعل يومك أسهل. بيانات كتالوج واضحة وخطوات شراء مرتبطة بالطلب.</p><Link href="/orders" data-testid="link-footer-phone"><PackageSearch size={15}/> تتبع طلبك</Link></div><div><h3>تسوق</h3><Link href="/search" data-testid="link-footer-all">كل المنتجات</Link>{categories.map((category) => <Link href={`/category/${category.slug}`} key={category.slug} data-testid={`link-footer-category-${category.slug}`}>{category.name}</Link>)}</div><div><h3>خدمة العملاء</h3><Link href="/orders" data-testid="link-footer-orders">تتبع طلبك</Link><Link href="/shipping">الشحن والتوصيل</Link><Link href="/return-policy">الإرجاع والاستبدال</Link><Link href="/faq">الأسئلة الشائعة</Link><Link href="/contact">تواصل معنا</Link></div><div><h3>اعرف أكثر</h3><Link href="/about">عن CABL</Link><Link href="/blog/best-power-bank-yemen">دليل الشراء</Link><Link href="/lab">مركز المواصفات</Link><Link href="/verify">التحقق من الضمان</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} CABL اليمن</span><span>الدفع الآمن يبدأ من معلومات واضحة</span></div></footer>
  </div>;
}