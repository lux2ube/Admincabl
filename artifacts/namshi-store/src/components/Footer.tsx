import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 mt-auto">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
             <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <span className="font-display font-extrabold text-2xl tracking-tighter text-white">CABL</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              منتجات الشحن والطاقة الأصلية، مع ضمان موثوق وتوصيل سريع. نوفر لك راحة البال قبل وبعد الشراء.
            </p>
          </div>
          
          <div>
            <h4 className="font-display text-white font-bold mb-6">الأقسام الرئيسية</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link href="/power-banks" className="hover:text-white transition-colors">باور بانك</Link></li>
              <li><Link href="/chargers" className="hover:text-white transition-colors">شواحن جدارية</Link></li>
              <li><Link href="/cables" className="hover:text-white transition-colors">كابلات شحن</Link></li>
              <li><Link href="/car-accessories" className="hover:text-white transition-colors">إكسسوارات سيارة</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-white font-bold mb-6">أشهر العلامات</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link href="/anker" className="hover:text-white transition-colors">Anker (انكر)</Link></li>
              <li><Link href="/baseus" className="hover:text-white transition-colors">Baseus (بيسوس)</Link></li>
              <li><Link href="/ugreen" className="hover:text-white transition-colors">UGREEN (يوجرين)</Link></li>
              <li><Link href="/vention" className="hover:text-white transition-colors">Vention (فينشن)</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-white font-bold mb-6">المساعدة</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li><Link href="/contact" className="hover:text-white transition-colors">تواصل معنا</Link></li>
              <li><Link href="/warranty" className="hover:text-white transition-colors">سياسة الضمان</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">الشحن والتوصيل</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/guides/charger-buying-guide/" className="hover:text-white transition-colors">دليل اختيار الشاحن</Link></li>
              <li><Link href="/compare/anker-vs-ugreen/" className="hover:text-white transition-colors">مقارنات العلامات</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-semibold gap-4">
          <p>© {new Date().getFullYear()} CABL. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-white">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
