import { useStore } from '../lib/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';

export function Favorites() {
  const { products, favorites } = useStore();
  
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom">
        <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-8 flex items-center gap-3">
          <Heart className="text-red-500 fill-red-500" size={32} />
          المفضلة
        </h1>

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {favoriteProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <Heart size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">قائمة المفضلة فارغة</h3>
            <p className="text-slate-500 font-semibold mb-6">
              لم تقم بإضافة أي منتجات إلى المفضلة بعد.
            </p>
            <Link href="/" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors">
              تصفح المنتجات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}