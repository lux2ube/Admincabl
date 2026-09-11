import { Link, useLocation } from 'wouter';
import { useStore } from '@/lib/StoreContext';
import { ShoppingCart, Heart, Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { cartItemCount, favorites, products, categories, brands, currencies, shippingOptions, currencyCode, setCurrencyCode } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-1.5 text-xs font-medium text-center">
        {products.length} منتج في الكتالوج | {shippingOptions.length} خيارات شحن متاحة عند إتمام الطلب
      </div>
      
      {/* Main Header */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 -ms-2 hover:bg-muted rounded-full"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tighter text-primary">CABL</span>
            <span className="font-bold text-sm text-muted-foreground hidden sm:inline-block">كابل ستور</span>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="w-full relative">
            <input 
              type="search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتجات، ماركات..." 
              className="w-full h-10 ps-10 pe-4 rounded-full border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
            />
            <button type="submit" className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center">
            <select 
              value={currencyCode} 
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="bg-transparent text-sm font-bold border-none outline-none cursor-pointer p-1"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>

          <Link href="/favorites" className="p-2 hover:bg-muted rounded-full relative transition-colors">
            <Heart className="w-5 h-5" />
            {favorites.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center -translate-y-1/4 translate-x-1/4">
                {favorites.length}
              </span>
            )}
          </Link>
          
          <Link href="/checkout" className="p-2 hover:bg-muted rounded-full relative transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center -translate-y-1/4 translate-x-1/4">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block border-t">
        <div className="container mx-auto px-4 h-12 flex items-center gap-8 text-sm font-bold">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground font-normal">الأقسام:</span>
            {categories.slice(0, 5).map(cat => (
              <Link key={cat.id} href={`/${cat.slug}`} className="hover:text-primary transition-colors">
                {cat.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-6 ms-auto">
            <span className="text-muted-foreground font-normal">الماركات:</span>
            {brands.slice(0, 4).map(brand => (
              <Link key={brand.slug} href={`/${brand.slug}`} className="hover:text-primary transition-colors">
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-background h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <span className="font-black text-xl text-primary">CABL</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <form onSubmit={handleSearch} className="mb-6 relative">
                <input 
                  type="search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث هنا..." 
                  className="w-full h-12 ps-10 pe-4 rounded-xl border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
                />
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </form>

              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-sm text-muted-foreground uppercase tracking-wider mb-3">الأقسام</h3>
                  <div className="grid gap-2">
                    {categories.map(cat => (
                      <Link key={cat.id} href={`/${cat.slug}`} onClick={() => setIsMenuOpen(false)} className="block py-2 font-bold text-foreground hover:text-primary">
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-sm text-muted-foreground uppercase tracking-wider mb-3">الماركات</h3>
                  <div className="grid gap-2">
                    {brands.map(brand => (
                      <Link key={brand.slug} href={`/${brand.slug}`} onClick={() => setIsMenuOpen(false)} className="block py-2 font-bold text-foreground hover:text-primary">
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-black text-sm text-muted-foreground uppercase tracking-wider mb-3">العملة</h3>
                  <select 
                    value={currencyCode} 
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full bg-muted/50 border rounded-xl h-12 px-4 font-bold outline-none"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
