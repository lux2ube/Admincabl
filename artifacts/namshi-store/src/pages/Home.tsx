import { Link } from 'wouter';
import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Zap, Smartphone, Cable, Car, ShieldCheck, ThumbsUp, HelpCircle } from 'lucide-react';

export function Home() {
  const { products } = useStore();
  const featured = products.slice(0, 8);
  const needProducts = products.filter(p => p.category?.slug === 'power-banks').slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb]">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none"></div>
        <div className="container-custom relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs mb-8 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            أحدث منتجات انكر متوفرة الآن
          </div>
          <h1 className="font-display text-[2rem] md:text-5xl lg:text-[4rem] font-black leading-[1.15] tracking-[-0.03em] text-[#0a1220] mb-6">
            شحنٌ ذكي يعرف جهازك،<br className="hidden md:block" /> ويحميه كل لحظة.
          </h1>
          <p className="font-display text-xl md:text-3xl font-bold tracking-[-0.02em] text-slate-600 mb-10">
            لا تحتاج إلى حفظ أرقام الموديلات.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/power-banks" className="cabl-btn-primary h-14 text-base px-8">
              كل الاختيارات
            </Link>
            <Link href="/chargers" className="cabl-btn-secondary h-14 text-base px-8">
              تصفح الشواحن
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-3">
            <CategoryPill href="/power-banks" icon={<Zap size={16}/>} label="طاقة تكمل يومك" />
            <CategoryPill href="/chargers" icon={<Zap size={16}/>} label="شحن أسرع وأكثر أمانًا" />
            <CategoryPill href="/cables" icon={<Cable size={16}/>} label="الكابل المناسب لجهازك" />
            <CategoryPill href="/car-accessories" icon={<Car size={16}/>} label="شحن عملي في السيارة" />
            <CategoryPill href="/search" icon={<Smartphone size={16}/>} label="ابحث حسب جهازك" />
          </div>
        </div>
      </section>

      {/* Brand Families Section */}
      <section className="py-20 bg-[#07111f] text-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-black tracking-[-0.03em] mb-4">أربع علامات. لكل واحدة نقاط قوة مختلفة.</h2>
            <p className="text-slate-400 font-semibold text-lg">اختر العائلة التي تناسب احتياجك اليومي.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FamilyCard 
              brand="انكر" 
              title="طاقة تثق فيها." 
              desc="باور بانك وشواحن وكابلات للاستخدام اليومي." 
              href="/anker" 
              color="blue"
            />
            <FamilyCard 
              brand="Baseus" 
              title="حلول عملية بتصميم ذكي." 
              desc="شواحن وكابلات وإكسسوارات للاستخدام اليومي." 
              href="/baseus" 
              color="purple"
            />
            <FamilyCard 
              brand="UGREEN" 
              title="توافق واضح واتصال موثوق." 
              desc="كابلات ومحولات وشواحن لمختلف الأجهزة." 
              href="/ugreen" 
              color="cyan"
            />
            <FamilyCard 
              brand="Vention" 
              title="التوصيلة المناسبة لكل استخدام." 
              desc="كابلات ومحولات وحلول ربط للأجهزة." 
              href="/vention" 
              color="amber"
            />
          </div>
        </div>
      </section>

      {/* Problem Solving Section */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            <div className="lg:col-span-4 flex flex-col justify-center">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.03em] text-[#0a1220] mb-6 leading-tight">
                أخبرنا بما يحتاجه يومك.
              </h2>
              <p className="text-slate-600 font-semibold text-lg mb-8">
                اختر احتياجك وسنوجهك مباشرة للمنتجات المتوافقة والمناسبة.
              </p>
              
              <div className="flex flex-col gap-3">
                <NeedsButton href="/power-banks" label="أحتاج إلى طاقة تدوم أطول" active />
                <NeedsButton href="/chargers" label="أريد شحنًا أسرع" />
                <NeedsButton href="/cables" label="أحتاج إلى كابل للاستخدام اليومي" />
                <NeedsButton href="/car-accessories" label="أريد حلًا للشحن في السيارة" />
                <NeedsButton href="/search" label="أريد البحث حسب اسم الجهاز" />
              </div>
            </div>
            
            <div className="lg:col-span-8 bg-slate-50 rounded-[2.5rem] p-6 md:p-10 border border-slate-200">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="font-display text-xl md:text-2xl font-bold text-[#0a1220]">اختيارات طاقة للاستخدام اليومي</h3>
                 <Link href="/power-banks" className="text-sm font-bold text-blue-600 hover:underline">عرض الكل</Link>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                  {needProducts.length > 0 ? needProducts.map(product => (
                   <ProductCard key={product.id} product={product} />
                 )) : featured.slice(0,4).map(product => (
                   <ProductCard key={product.id} product={product} />
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* General Products */}
      <section className="py-20 bg-[#f8f9fb] border-t border-slate-200">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-[-0.03em] text-[#0a1220]">ابدأ من اختيارات واضحة ومتنوعة.</h2>
            </div>
            <Link href="/search" className="cabl-btn-secondary bg-white">
              كل الاختيارات
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.03em] text-[#0a1220] mb-6">اشترِ وأنت تعرف كل خطوة.</h2>
             <p className="text-slate-600 font-semibold text-lg">CABL هو الاختيار الأوضح لإكسسوارات الموبايل في اليمن.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-display text-xl font-bold text-[#0a1220] mb-3">راجع سجل ضمان CABL</h3>
              <p className="text-slate-600 font-semibold text-sm leading-relaxed">راجع مدة الضمان وشروطه المكتوبة في صفحة كل منتج قبل الطلب.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <ThumbsUp size={32} />
              </div>
              <h3 className="font-display text-xl font-bold text-[#0a1220] mb-3">افهم المواصفات قبل الشراء</h3>
              <p className="text-slate-600 font-semibold text-sm leading-relaxed">أدلة شراء مفصلة، ومقارنات واضحة بين العلامات التجارية لنضمن لك اختيار الأنسب.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <HelpCircle size={32} />
              </div>
              <h3 className="font-display text-xl font-bold text-[#0a1220] mb-3">اعرف ما يحدث بعد الطلب</h3>
              <p className="text-slate-600 font-semibold text-sm leading-relaxed">تظهر طريقة الشحن وتكلفتها في ملخص الطلب، ثم يتواصل الفريق لتأكيد التفاصيل.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function CategoryPill({ label, icon, href }: { label: string, icon: React.ReactNode, href: string }) {
  return (
    <Link href={href} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98] hover:border-blue-300 hover:text-blue-600 hover:shadow-md">
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}

function NeedsButton({ label, href, active = false }: { label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className={`flex min-h-[56px] items-center gap-3 rounded-2xl border px-5 py-3 text-start text-sm md:text-base font-bold transition-all
      ${active 
        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
    >
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-300'}`} />
      {label}
    </Link>
  );
}

function FamilyCard({ brand, title, desc, href, color }: { brand: string, title: string, desc: string, href: string, color: 'blue' | 'purple' | 'cyan' | 'amber' }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-900/40 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-900/40 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-900/40 border-cyan-500/30 text-cyan-400',
    amber: 'from-amber-500/20 to-amber-900/40 border-amber-500/30 text-amber-400',
  };
  
  return (
    <Link href={href} className={`flex flex-col p-8 rounded-3xl border bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] group ${colorMap[color]}`}>
      <span className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">{brand}</span>
      <h3 className="font-display text-2xl font-black text-white mb-3 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-slate-400 font-semibold text-sm leading-relaxed mt-auto pt-8">{desc}</p>
    </Link>
  );
}
