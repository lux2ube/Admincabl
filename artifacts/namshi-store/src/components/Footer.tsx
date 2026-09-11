import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-[#07111f] text-slate-400 py-16 md:py-24 mt-auto border-t border-slate-800">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2">
             <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <span className="font-display font-black text-3xl tracking-tighter text-white group-hover:text-blue-500 transition-colors">CABL</span>
            </Link>
            <p className="text-sm leading-relaxed mb-8 max-w-sm text-slate-300 font-semibold">
              شحن ذكي يعرف جهازك، ويحميه كل لحظة. منتجات الشحن والطاقة الأصلية في اليمن، مع ضمان موثوق وتوصيل سريع. 
            </p>
            <div className="flex gap-3">
              <a href="/contact" aria-label="تواصل مع CABL" className="touch-target bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
                <FacebookIcon size={20} />
              </a>
              <a href="/contact" aria-label="خدمة عملاء CABL" className="touch-target bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
                <InstagramIcon size={20} />
              </a>
              <a href="/contact" aria-label="دعم CABL" className="touch-target bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
                <TwitterIcon size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-display text-white font-bold text-lg mb-6">تسوق حسب الفئة</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link href="/power-banks" className="hover:text-white transition-colors">باور بانك</Link></li>
              <li><Link href="/chargers" className="hover:text-white transition-colors">شواحن جدارية</Link></li>
              <li><Link href="/cables" className="hover:text-white transition-colors">كابلات شحن</Link></li>
              <li><Link href="/car-accessories" className="hover:text-white transition-colors">إكسسوارات سيارة</Link></li>
              <li><a href="/hubs-adapters/" className="hover:text-white transition-colors">محولات وUSB-C Hubs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-white font-bold text-lg mb-6">العلامات التجارية</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link href="/anker" className="hover:text-white transition-colors">انكر (Anker)</Link></li>
              <li><Link href="/baseus" className="hover:text-white transition-colors">بيسوس (Baseus)</Link></li>
              <li><Link href="/ugreen" className="hover:text-white transition-colors">يوجرين (UGREEN)</Link></li>
              <li><Link href="/vention" className="hover:text-white transition-colors">فينشن (Vention)</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-white font-bold text-lg mb-6">أدلة ومقالات</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li><a href="/guides/power-bank-buying-guide/" className="hover:text-white transition-colors">كيف تختار باور بانك يناسب يومك؟</a></li>
              <li><a href="/compare/anker-vs-ugreen/" className="hover:text-white transition-colors">مقارنة بين Anker وUGREEN</a></li>
              <li><a href="/guides/charger-buying-guide/" className="hover:text-white transition-colors">دليل اختيار الشاحن المناسب</a></li>
              <li><a href="/warranty/" className="hover:text-white transition-colors">راجع ضمان CABL</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-semibold gap-6">
          <p>© {new Date().getFullYear()} متجر CABL. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href="/contact/" className="hover:text-white transition-colors">تواصل معنا</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
}

function InstagramIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
}

function TwitterIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
}