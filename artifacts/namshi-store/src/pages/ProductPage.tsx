import { useMemo, useState } from 'react';
import { useStore } from '../lib/StoreContext';
import { ShoppingBag, ShieldCheck, Truck, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { ProductCard } from '../components/ProductCard';

export function ProductPage({ slug }: { slug: string }) {
  const { products, formatMoney, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  
  const product = useMemo(() => {
    return products.find(p => p.slug === slug);
  }, [products, slug]);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.id !== product.id && (p.category?.slug === product.category?.slug || p.brandSlug === product.brandSlug)).slice(0, 4);
  }, [products, product]);
  const safeDescription = product?.description
    ?.replace(/الوكيل الحصري[^،.]*[،.]?/g, '')
    .replace(/وكيل حصري[^،.]*[،.]?/g, '')
    .trim();

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f8f9fb]">
        <h2 className="font-display font-bold text-2xl text-slate-800">جاري تحميل المنتج... أو أن المنتج غير موجود.</h2>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="container-custom py-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 overflow-x-auto scrollbar-hide whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
          <span>/</span>
          {product.brandSlug && <Link href={`/${product.brandSlug}`} className="hover:text-blue-600">{product.brand}</Link>}
          <span>/</span>
          {product.category?.slug && <Link href={`/${product.category.slug}`} className="hover:text-blue-600">{product.category.name}</Link>}
          <span>/</span>
          <span className="text-slate-800 truncate">{product.name}</span>
        </div>
      </div>

      <div className="container-custom">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10 lg:p-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Product Image */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#f8f9fb] rounded-[2rem] aspect-square flex items-center justify-center p-8 border border-slate-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain mix-blend-multiply" 
                />
              </div>
            </div>

            {/* Product Details - CairoVolt layout style */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{product.brand}</span>
                {product.category && <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{product.category.name}</span>}
              </div>
              
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-[#0a1220] leading-[1.3] mb-6">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-4 mb-8">
                <span className="font-display font-black text-4xl text-[#0a1220]">
                  {formatMoney(product.price)}
                </span>
                {product.discountPrice && (
                  <del className="text-lg text-slate-400 font-bold mb-1">{formatMoney(product.regularPrice)}</del>
                )}
              </div>

              {/* CairoVolt Combo / Action Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Quantity */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl h-[56px] px-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      aria-label="تقليل الكمية"
                      className="touch-target text-slate-500 hover:bg-slate-50 hover:text-[#0a1220] rounded-xl transition-colors font-bold text-xl w-10 h-10 flex items-center justify-center"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="font-bold text-lg w-12 text-center text-[#0a1220]">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                      aria-label="زيادة الكمية"
                      className="touch-target text-slate-500 hover:bg-slate-50 hover:text-[#0a1220] rounded-xl transition-colors font-bold text-xl w-10 h-10 flex items-center justify-center"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  {/* Add to Cart */}
                  <button 
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 min-w-0 px-6 py-4 font-bold text-base md:text-lg rounded-2xl transition-all duration-200 shadow-lg bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <ShoppingBag size={22} />
                    أضف للسلة
                  </button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0a1220] mb-1">ضمان CABL</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{product.warranty || 'ضمان استبدال ضد عيوب الصناعة من CABL.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0a1220] mb-1">معلومات الشحن</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">تظهر خيارات الشحن المتاحة وتكلفتها أثناء إتمام الطلب.</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-8 border-t border-slate-200">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-[#0a1220] mb-4">
                  التفاصيل
                </h2>
                <div className="prose prose-slate prose-sm font-semibold max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {safeDescription}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-2xl font-black text-[#0a1220] mb-8">قد يعجبك أيضاً</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}