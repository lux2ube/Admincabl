import { useMemo } from 'react';
import { useStore } from '../lib/StoreContext';
import { ShoppingBag, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export function ProductPage({ slug }: { slug: string }) {
  const { products, formatMoney, addToCart } = useStore();
  
  const product = useMemo(() => {
    // Some routes have product-slug.
    return products.find(p => p.slug === slug);
  }, [products, slug]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <h2 className="font-display font-bold text-2xl text-slate-800">جاري تحميل المنتج... أو أن المنتج غير موجود.</h2>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container-custom py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-6">
          <ArrowRight size={16} />
          العودة للرئيسية
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 flex items-center justify-center relative overflow-hidden group">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full max-w-md aspect-square object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
            />
          </div>

          <div className="flex flex-col">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">{product.brand}</span>
            <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            
            <p className="text-slate-600 text-lg leading-relaxed mb-6 font-semibold">
              {product.description || `منتج أصلي من ${product.brand} لضمان تجربة شحن آمنة وسريعة.`}
            </p>

            <div className="flex items-end gap-4 mb-8 pb-8 border-b border-slate-100">
              <span className="font-display font-extrabold text-4xl text-slate-900">
                {formatMoney(product.price)}
              </span>
              {product.discountPrice && (
                <del className="text-lg text-slate-400 font-bold mb-1">{formatMoney(product.regularPrice)}</del>
              )}
            </div>

            <button 
              onClick={() => addToCart(product)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-colors w-full mb-8 shadow-lg shadow-blue-600/20"
            >
              <ShoppingBag size={24} />
              أضف إلى السلة
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck size={24} className="text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">ضمان CABL</h4>
                  <p className="text-xs text-slate-500 font-semibold">{product.warranty || 'ضمان استبدال ضد عيوب الصناعة.'}</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                <Truck size={24} className="text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">توصيل سريع</h4>
                  <p className="text-xs text-slate-500 font-semibold">خيارات توصيل مرنة لجميع المحافظات.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
