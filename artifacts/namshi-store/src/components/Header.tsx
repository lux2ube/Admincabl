import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, Search, ShoppingBag, Heart, X, Smartphone, Zap } from 'lucide-react';
import { useStore } from '../lib/StoreContext';

export function Header() {
  const { cartItemCount, setCartOpen, currencies, currencyCode, setCurrencyCode } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold py-2 text-center flex items-center justify-center gap-4">
        <span>ضمان CABL مكتوب</span>
        <span className="hidden sm:inline">•</span>
        <span>توصيل داخل اليمن</span>
        <span className="hidden sm:inline">•</span>
        <span>خدمة العملاء</span>
      </div>
      
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="container-custom py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-700" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-display font-extrabold text-2xl tracking-tighter text-blue-600">CABL</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 font-display text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
            <Link href="/power-banks" className="hover:text-blue-600 transition-colors">باور بانك</Link>
            <Link href="/chargers" className="hover:text-blue-600 transition-colors">شواحن</Link>
            <Link href="/cables" className="hover:text-blue-600 transition-colors">كابلات</Link>
            <Link href="/anker" className="hover:text-blue-600 transition-colors">منتجات Anker</Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <label className="hidden md:flex items-center">
              <span className="sr-only">العملة</span>
              <select
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                aria-label="اختيار العملة"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code}</option>
                ))}
              </select>
            </label>
            <Link href="/search" className="p-2 text-slate-700 hover:text-blue-600 transition-colors">
              <Search size={20} />
            </Link>
            <Link href="/favorites" className="p-2 text-slate-700 hover:text-blue-600 transition-colors hidden sm:block">
              <Heart size={20} />
            </Link>
            <button 
              className="relative p-2 text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-2"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
              <span className="hidden sm:inline font-bold text-sm">السلة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-fade-in">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <span className="font-display font-extrabold text-xl text-blue-600">CABL</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-5 flex flex-col gap-4 font-display font-semibold text-slate-700 text-lg">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>الرئيسية</Link>
              <Link href="/power-banks" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3"><Zap size={20} className="text-blue-500" /> باور بانك</Link>
              <Link href="/chargers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3"><Smartphone size={20} className="text-blue-500" /> شواحن</Link>
              <Link href="/cables" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3"><Smartphone size={20} className="text-blue-500" /> كابلات</Link>
              <div className="h-px bg-slate-100 my-2" />
              <span className="text-sm text-slate-400 font-sans">العلامات التجارية</span>
              <Link href="/anker" onClick={() => setMobileMenuOpen(false)}>Anker</Link>
              <Link href="/baseus" onClick={() => setMobileMenuOpen(false)}>Baseus</Link>
              <Link href="/ugreen" onClick={() => setMobileMenuOpen(false)}>UGREEN</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
