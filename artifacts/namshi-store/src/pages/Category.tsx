import { useMemo, useState } from 'react';
import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function Category({ categorySlug }: { categorySlug: string }) {
  const { products, categories } = useStore();
  const [activeFilter, setActiveFilter] = useState('all');
  
  const categoryLabel = useMemo(() => {
    const matched = categories.find(c => c.slug === categorySlug);
    if (matched) return matched.name;
    const hints: Record<string, string> = {
      'power-banks': 'باور بانك',
      'chargers': 'الشواحن',
      'cables': 'الكابلات',
      'car-accessories': 'إكسسوارات السيارات',
      'audio': 'صوتيات'
    };
    return hints[categorySlug] || categorySlug;
  }, [categories, categorySlug]);

  const categoryProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.category) return false;
      return p.category.slug === categorySlug || 
             (categorySlug === 'power-banks' && p.category.name.includes('باور')) ||
             (categorySlug === 'chargers' && p.category.name.includes('شاحن')) ||
             (categorySlug === 'cables' && p.category.name.includes('كابل')) ||
             (categorySlug === 'audio' && (p.category.name.includes('سماع') || p.name.includes('سماع')));
    });
  }, [products, categorySlug]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return categoryProducts;
    if (activeFilter === 'under-10') return categoryProducts.filter(p => p.price < 10);
    if (activeFilter === '10-25') return categoryProducts.filter(p => p.price >= 10 && p.price <= 25);
    if (activeFilter === 'over-25') return categoryProducts.filter(p => p.price > 25);
    return categoryProducts;
  }, [categoryProducts, activeFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb]">
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom py-12 md:py-20">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-[-0.03em] text-[#0a1220]">
            {categoryLabel} في اليمن
          </h1>
          <p className="text-slate-600 font-semibold max-w-2xl text-lg md:text-xl">
            تصفح أحدث منتجات {categoryLabel} الأصلية، وقارن المواصفات والأسعار من أفضل العلامات المعتمدة.
          </p>
        </div>
      </div>

      <div className="container-custom py-12 flex-1">
        
        {/* Filters inspired by CairoVolt NeedsButton & Pills */}
        <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            <FilterPill label="كل المنتجات" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
            <FilterPill label="أقل من 10 دولار" active={activeFilter === 'under-10'} onClick={() => setActiveFilter('under-10')} />
            <FilterPill label="10 - 25 دولار" active={activeFilter === '10-25'} onClick={() => setActiveFilter('10-25')} />
            <FilterPill label="أكثر من 25 دولار" active={activeFilter === 'over-25'} onClick={() => setActiveFilter('over-25')} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <span className="font-bold text-slate-500 text-sm">{filteredProducts.length} منتجات</span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <h3 className="font-display font-bold text-2xl text-[#0a1220] mb-3">لا توجد منتجات</h3>
            <p className="text-slate-500 font-semibold text-lg">لم نتمكن من العثور على منتجات في هذا القسم تطابق التصفية الحالية.</p>
            <button onClick={() => setActiveFilter('all')} className="mt-6 font-bold text-blue-600 hover:underline">
              عرض كل المنتجات
            </button>
          </div>
        )}

        {/* Educational Content Area - CairoVolt Style Guide */}
        {categoryProducts.length > 0 && (
          <div className="mt-24 max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-sm">
            <h2 className="font-display text-2xl md:text-3xl font-black text-center mb-8 text-[#0a1220]">
              كيف تختار {categoryLabel} المناسب لك؟
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">1. حدد جهازك واحتياجه</h3>
                <p className="text-slate-600 font-semibold leading-relaxed">
                  قبل الشراء، راجع قوة الشحن التي يدعمها جهازك. لا فائدة من شاحن أو كابل أو باور بانك بقوة 65 واط إذا كان هاتفك يدعم 20 واط فقط كحد أقصى.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">2. قارن المواصفات وليس الحجم</h3>
                <p className="text-slate-600 font-semibold leading-relaxed">
                  الحجم الأصغر قد يعني تقنيات أحدث مثل GaN، لكنه ليس المقياس الوحيد. ركز على عدد المنافذ، وتقنيات الحماية المتوفرة، والتقييمات الفعلية.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">3. راجع تفاصيل الطلب والضمان</h3>
                <p className="text-slate-600 font-semibold leading-relaxed">
                  راجع مدة الضمان وشروطه المكتوبة في صفحة المنتج قبل تأكيد الطلب.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`min-h-[40px] rounded-full border px-5 py-2 text-sm font-bold transition-all
      ${active 
        ? 'border-[#0a1220] bg-[#0a1220] text-white shadow-md' 
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
}