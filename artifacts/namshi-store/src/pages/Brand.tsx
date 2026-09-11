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
    <div className="flex flex-col min-h-screen bg-[#f8f9fb]">
      
      {/* Brand Hero - CairoVolt Style Gradient Header */}
      <div className="bg-white border-b border-slate-200 overflow-hidden relative">
         <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
         <div className="container-custom relative z-10 py-16 md:py-24">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-blue-200">
            كتالوج العلامة التجارية
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[4rem] font-black mb-6 tracking-tight text-[#0a1220] leading-tight">
            منتجات {brandName} في اليمن
          </h1>
          <p className="text-slate-600 font-bold text-lg md:text-2xl max-w-3xl leading-relaxed">
            تصفح أحدث منتجات الشحن والطاقة الأصلية من {brandName}، مع ضمان CABL المكتوب والتوصيل المباشر.
          </p>
        </div>
      </div>

      {/* Categories breakdown within Brand */}
      <div className="container-custom py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl font-black text-[#0a1220] mb-8">
          اختر قسم منتجات {brandName} المناسب لجهازك
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <BrandCategoryCard href="/power-banks" title="طاقة تكمل يومك" subtitle="باور بانك" />
          <BrandCategoryCard href="/chargers" title="شحن أسرع، بحجم أصغر" subtitle="شواحن" />
          <BrandCategoryCard href="/cables" title="كابل للاستخدام اليومي" subtitle="كابلات" />
          <BrandCategoryCard href="/car-accessories" title="شحن ثابت في كل مشوار" subtitle="إكسسوارات سيارة" />
        </div>

        <div className="mb-12">
          <h2 className="font-display text-3xl font-black text-[#0a1220] mb-8">مختارات من {brandName}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {brandProducts.length > 0 ? (
              brandProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center">
                <p className="font-bold text-slate-500">لا توجد منتجات لهذه العلامة التجارية حالياً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandCategoryCard({ title, subtitle, href }: { title: string, subtitle: string, href: string }) {
  return (
    <a href={href} className="block bg-white border border-slate-200 p-6 rounded-[2rem] hover:shadow-md transition-shadow cursor-pointer group">
      <span className="text-sm font-bold text-blue-600 mb-2 block">{subtitle}</span>
      <h3 className="font-display text-lg font-black text-[#0a1220] leading-tight group-hover:text-blue-700 transition-colors">
        {title}
      </h3>
    </a>
  );
}