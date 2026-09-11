import { Link } from 'wouter';
import { useStore } from '@/lib/StoreContext';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { useSubscribeNewsletter } from '@workspace/api-client-react';

export function Footer() {
  const { categories, brands } = useStore();
  const [email, setEmail] = useState('');
  const subscribe = useSubscribeNewsletter();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribe.mutate({ data: { email } }, {
        onSuccess: () => {
          setEmail('');
          // Would show toast here if we imported it
        }
      });
    }
  };

  return (
    <footer className="bg-card border-t pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="font-black text-3xl tracking-tighter text-primary">CABL</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
              واجهة CABL لعرض المنتجات والفئات والعلامات والأسعار المتاحة حاليًا من قاعدة بيانات المتجر.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-lg mb-6">تسوق حسب القسم</h4>
            <ul className="space-y-3">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link href={`/${cat.slug}`} className="text-muted-foreground hover:text-primary text-sm font-bold transition-colors block">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-lg mb-6">أشهر الماركات</h4>
            <ul className="space-y-3">
              {brands.slice(0, 6).map(brand => (
                <li key={brand.slug}>
                  <Link href={`/${brand.slug}`} className="text-muted-foreground hover:text-primary text-sm font-bold transition-colors block">
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-black text-lg mb-6">النشرة البريدية</h4>
            <p className="text-muted-foreground text-sm font-medium mb-4">
              اشترك للحصول على آخر العروض والمنتجات الجديدة.
            </p>
            <form onSubmit={handleSubscribe} className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني" 
                className="w-full h-12 bg-muted/50 border rounded-xl ps-4 pe-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
              <button 
                type="submit" 
                disabled={subscribe.isPending}
                className="absolute end-1 top-1 w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-muted-foreground">
          <p>© {new Date().getFullYear()} CABL Store. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
