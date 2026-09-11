import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, ShoppingBag, Heart, X, Smartphone, Zap, Headphones, Car, ChevronDown } from 'lucide-react';
import { useStore } from '../lib/StoreContext';

export function Header() {
  const { cartItemCount, setCartOpen, currencies, currencyCode, setCurrencyCode, categories } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="bg-[#0a1220] text-slate-300 text-xs font-semibold py-2.5 text-center flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4">
        <span className="flex items-center gap-1.5"><ShieldCheckIcon size={14} className="text-blue-500" /> ضمان CABL المكتوب</span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="flex items-center gap-1.5"><TruckIcon size={14} className="text-blue-500" /> خيارات الشحن تظهر أثناء إتمام الطلب</span>
      </div>
      
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200 ${isScrolled ? 'shadow-sm border-b border-slate-200/50 py-3' : 'py-4'}`}>
        <div className="container-custom flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden touch-target text-slate-700 hover:bg-slate-100 rounded-xl transition-colors" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح قائمة التنقل"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={24} />
            </button>
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="font-display font-black text-3xl tracking-tighter text-[#0a1220] group-hover:text-blue-600 transition-colors">
                CABL
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 font-display text-[15px] font-bold text-slate-600">
            <Link href="/" className={`transition-colors ${location === '/' ? 'text-blue-600' : 'hover:text-[#0a1220]'}`}>الرئيسية</Link>
            <div className="relative group">
              <button aria-label="فتح قائمة الأقسام" className="flex items-center gap-1 hover:text-[#0a1220] transition-colors py-2">
                الأقسام <ChevronDown size={14} />
              </button>
              <div className="absolute top-full right-0 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0">
                <Link href="/power-banks" className="flex items-center gap-2 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-sm">
                  <Zap size={16} /> باور بانك
                </Link>
                <Link href="/chargers" className="flex items-center gap-2 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-sm">
                  <Zap size={16} /> شواحن
                </Link>
                <Link href="/cables" className="flex items-center gap-2 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-sm">
                  <Smartphone size={16} /> كابلات
                </Link>
                <Link href="/car-accessories" className="flex items-center gap-2 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-sm">
                  <Car size={16} /> إكسسوارات سيارة
                </Link>
              </div>
            </div>
            <Link href="/anker" className={`transition-colors ${location === '/anker' ? 'text-blue-600' : 'hover:text-[#0a1220]'}`}>انكر</Link>
            <Link href="/baseus" className={`transition-colors ${location === '/baseus' ? 'text-blue-600' : 'hover:text-[#0a1220]'}`}>Baseus</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <label className="hidden md:flex items-center me-2">
              <span className="sr-only">العملة</span>
              <select
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
                className="bg-slate-50 text-xs font-bold text-slate-700 outline-none cursor-pointer py-1.5 px-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                aria-label="اختيار العملة"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code}</option>
                ))}
              </select>
            </label>
            <Link href="/search" aria-label="البحث" className="touch-target text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Search size={20} />
            </Link>
            <Link href="/favorites" aria-label="المفضلة" className="touch-target text-slate-700 hover:text-red-500 hover:bg-slate-100 rounded-xl transition-colors hidden sm:flex">
              <Heart size={20} />
            </Link>
            <button 
              className="touch-target text-[#0a1220] hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2 px-3 sm:px-4 ml-1 relative"
              onClick={() => setCartOpen(true)}
              aria-label={`فتح السلة، ${cartItemCount} منتج`}
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="قائمة التنقل" className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <span className="font-display font-black text-2xl text-[#0a1220]">CABL</span>
              <button aria-label="إغلاق قائمة التنقل" onClick={() => setMobileMenuOpen(false)} className="touch-target bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-5 flex flex-col gap-2 font-display font-bold text-slate-700 text-base">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl hover:bg-slate-50">الرئيسية</Link>
              
              <div className="h-px bg-slate-100 my-4" />
              <span className="text-xs text-slate-400 font-sans px-4 mb-2">الأقسام</span>
              
              <Link href="/power-banks" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-50">
                <Zap size={20} className="text-blue-500" /> باور بانك
              </Link>
              <Link href="/chargers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-50">
                <Zap size={20} className="text-blue-500" /> شواحن
              </Link>
              <Link href="/cables" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-50">
                <Smartphone size={20} className="text-blue-500" /> كابلات
              </Link>
              <Link href="/car-accessories" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-50">
                <Car size={20} className="text-blue-500" /> إكسسوارات سيارة
              </Link>

              <div className="h-px bg-slate-100 my-4" />
              <span className="text-xs text-slate-400 font-sans px-4 mb-2">العلامات التجارية</span>
              
              <Link href="/anker" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl hover:bg-slate-50 text-blue-600">Anker</Link>
              <Link href="/baseus" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl hover:bg-slate-50 text-slate-700">Baseus</Link>
              <Link href="/ugreen" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl hover:bg-slate-50 text-slate-700">UGREEN</Link>
            </nav>
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-500">عملة العرض:</span>
                <select
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  className="bg-white text-sm font-bold text-slate-700 outline-none p-3 rounded-xl border border-slate-200"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simple icons for the top bar
function ShieldCheckIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
}

function TruckIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
}