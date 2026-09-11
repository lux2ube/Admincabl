import { useStore } from '@/lib/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Search as SearchIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';

export default function Search() {
  const { products, isLoading } = useStore();
  const [, setLocation] = useLocation();
  const query = new URLSearchParams(window.location.search).get('q') || '';
  
  const [searchInput, setSearchInput] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const results = useMemo(() => {
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter(p => 
      p.productName.toLowerCase().includes(q) || 
      p.brand?.toLowerCase().includes(q) || 
      p.category?.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-card border-b py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-3xl font-black mb-6">البحث</h1>
          <form onSubmit={handleSearch} className="relative mb-4">
            <input 
              type="search" 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ابحث عن منتج، ماركة، قسم..." 
              className="w-full h-14 ps-12 pe-6 rounded-2xl border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-lg font-bold transition-all shadow-sm"
            />
            <button type="submit" className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <SearchIcon className="w-6 h-6" />
            </button>
          </form>
          {query && (
            <p className="text-muted-foreground font-medium text-sm">
              نتائج البحث عن: <strong className="text-foreground">"{query}"</strong> ({results.length} نتيجة)
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
              <SearchIcon className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black mb-2">لم نجد ما تبحث عنه</h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-md">
              عذراً، لا توجد منتجات تطابق كلمة البحث "{query}". جرب استخدام كلمات أخرى أو تصفح الأقسام.
            </p>
            <Link href="/" className="h-12 px-8 bg-card border text-foreground font-bold rounded-xl hover:bg-muted transition-colors inline-flex items-center">
              العودة للرئيسية
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
