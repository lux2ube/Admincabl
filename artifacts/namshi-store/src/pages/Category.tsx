import { useMemo } from 'react';
import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function Category({ categorySlug }: { categorySlug: string }) {
  const { products, categories } = useStore();
  
  const categoryLabel = useMemo(() => {
    const matched = categories.find(c => c.slug === categorySlug);
    if (matched) return matched.name;
    const hints: Record<string, string> = {
      'power-banks': 'الباور بانك',
      'chargers': 'الشواحن',
      'cables': 'الكابلات',
      'car-accessories': 'إكسسوارات السيارات'
    };
    return hints[categorySlug] || categorySlug;
  }, [categories, categorySlug]);

  const categoryProducts = useMemo(() => {
    return products.filter(p => {
      // Very basic filtering based on slug match for demo.
      // The real app handles this differently, but we'll approximate based on product category slug.
      if (!p.category) return false;
      return p.category.slug === categorySlug || 
             (categorySlug === 'power-banks' && p.category.name.includes('باور')) ||
             (categorySlug === 'chargers' && p.category.name.includes('شاحن')) ||
             (categorySlug === 'cables' && p.category.name.includes('كابل'));
    });
  }, [products, categorySlug]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-blue-600 text-white" style={{ backgroundImage: 'var(--gradient-blue)' }}>
        <div className="container-custom py-12 md:py-20 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold mb-4">{categoryLabel}</h1>
          <p className="text-blue-100 font-semibold max-w-2xl mx-auto">
            تصفح أحدث منتجات {categoryLabel}، وقارن المواصفات والأسعار من العلامات الأصلية المتوفرة.
          </p>
        </div>
      </div>

      <div className="container-custom py-12 flex-1">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <span className="font-bold text-slate-500 text-sm">{categoryProducts.length} منتجات</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
              ترتيب حسب: الأحدث
            </button>
          </div>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categoryProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">لا توجد منتجات</h3>
            <p className="text-slate-500 font-semibold">لم نتمكن من العثور على منتجات في هذا القسم حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}
