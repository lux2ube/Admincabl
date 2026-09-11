import { useStore } from '@/lib/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';

export default function Favorites() {
  const { products, favorites, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-card border-b py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black">المفضلة</h1>
              <p className="text-muted-foreground font-bold text-sm">المنتجات التي قمت بحفظها</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-3xl bg-card">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
              <Heart className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black mb-2">قائمة المفضلة فارغة</h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-sm">
              لم تقم بإضافة أي منتجات للمفضلة بعد. تصفح المنتجات واحفظ ما يعجبك لسهولة الوصول إليه لاحقاً.
            </p>
            <Link href="/" className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md">
              تصفح المنتجات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
