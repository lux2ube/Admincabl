import { Link } from 'wouter';
import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function Home() {
  const { products } = useStore();
  const featured = products.slice(0, 8);
  const bestSellers = products.slice(8, 12);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-blue-600 text-white overflow-hidden" style={{ backgroundImage: 'var(--gradient-blue)' }}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container-custom relative z-10 py-24 md:py-32 flex flex-col items-center text-center">
          <span className="text-blue-200 font-bold text-sm tracking-wider uppercase mb-4">CABL المتجر المعتمد</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold max-w-4xl leading-tight tracking-tight mb-6">
            شحن ذكي يعرف جهازك،<br />ويحميه كل لحظة.
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-semibold">
            منتجات الشحن والطاقة الأصلية من Anker و Baseus و UGREEN، مع ضمان CABL المكتوب وتوصيل سريع داخل اليمن.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/power-banks" className="bg-white text-blue-700 hover:bg-slate-50 font-bold py-4 px-8 rounded-full transition-colors shadow-lg shadow-blue-900/20">
              تسوق الباور بانك
            </Link>
            <Link href="/chargers" className="bg-blue-800 text-white hover:bg-blue-900 font-bold py-4 px-8 rounded-full transition-colors shadow-lg shadow-blue-900/20 border border-blue-700">
              تصفح الشواحن
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2 block">مختارات من الكتالوج</span>
              <h2 className="font-display text-3xl font-extrabold text-slate-900">منتجات متاحة الآن</h2>
            </div>
            <Link href="/search" className="text-slate-500 hover:text-blue-600 font-bold text-sm underline underline-offset-4">
              عرض كل المنتجات
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2 block">علامات تجارية</span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                اختر القسم المناسب لجهازك
              </h2>
              <p className="text-slate-600 text-lg font-semibold leading-relaxed mb-8">
                طاقة وشحن وكابلات للبيت والشغل والعربية — كل قسم يوصلك مباشرة للخيارات المتوافقة بدل الحيرة بين الموديلات.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/power-banks" className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600">باور بانك</h3>
                  <span className="text-xs text-slate-500 font-semibold">طاقة تكمل يومك</span>
                </Link>
                <Link href="/chargers" className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600">شواحن</h3>
                  <span className="text-xs text-slate-500 font-semibold">شحن أسرع وأأمن</span>
                </Link>
                <Link href="/cables" className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600">كابلات</h3>
                  <span className="text-xs text-slate-500 font-semibold">كابل يعيش معاك</span>
                </Link>
                <Link href="/car-accessories" className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600">سيارات</h3>
                  <span className="text-xs text-slate-500 font-semibold">ثبات وشحن</span>
                </Link>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
               <div className="relative z-10">
                 <h3 className="font-display font-bold text-2xl text-slate-900 mb-6">الأكثر مبيعاً</h3>
                 <div className="space-y-4">
                   {bestSellers.map(product => (
                     <Link key={product.id} href={`/product/${product.slug}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                       <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                         <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                       </div>
                       <div>
                         <span className="text-xs font-bold text-blue-600 mb-1 block">{product.brand}</span>
                         <h4 className="font-display font-semibold text-sm text-slate-800 line-clamp-1">{product.name}</h4>
                       </div>
                     </Link>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
