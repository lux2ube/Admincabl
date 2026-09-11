import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { useLocation } from 'wouter';
import { Search as SearchIcon, X } from 'lucide-react';
import { useState, useMemo } from 'react';

export function Search() {
  const { products } = useStore();
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  const results = useMemo(() => {
    if (!query.trim()) return products.slice(0, 4); // show some default
    const q = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [query, products]);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="عن ماذا تبحث؟ (شاحن 65 واط، باور بانك...)"
            className="w-full bg-white border border-slate-200 rounded-full py-4 pr-12 pl-4 text-slate-800 font-display font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          )}
        </form>

        <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">
          {query.trim() ? `نتائج البحث عن "${query}"` : 'مقترحات لك'}
        </h2>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <SearchIcon size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">لا توجد نتائج</h3>
            <p className="text-slate-500 font-semibold max-w-md mx-auto">
              لم نتمكن من العثور على منتجات تطابق بحثك. جرب استخدام كلمات عامة مثل "شاحن" أو "كابل".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
