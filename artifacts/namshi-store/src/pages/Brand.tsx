import { useMemo } from 'react';
import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function Brand({ brandSlug }: { brandSlug: string }) {
  const { products } = useStore();
  
  const brandName = brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1);

  const brandProducts = useMemo(() => {
    return products.filter(p => p.brandSlug === brandSlug || p.brand.toLowerCase() === brandSlug.toLowerCase());
  }, [products, brandSlug]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
         <div className="container-custom relative z-10 py-16 md:py-24 text-center">
          <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            كتالوج العلامة التجارية
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            منتجات {brandName} في اليمن
          </h1>
          <p className="text-slate-300 font-semibold max-w-2xl mx-auto">
            تصفح أحدث منتجات الشحن والطاقة الأصلية من {brandName}، مع ضمان CABL المكتوب والتوصيل المباشر.
          </p>
        </div>
      </div>

      <div className="container-custom py-12 flex-1">
        <div className="mb-12">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-6">مختارات من {brandName}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {brandProducts.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
