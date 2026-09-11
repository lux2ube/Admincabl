import { Link } from 'wouter';
import { ShoppingBag, Heart, Plus } from 'lucide-react';
import { useStore, type Product } from '../lib/StoreContext';

export function ProductCard({ product }: { product: Product }) {
  const { formatMoney, addToCart, favorites, toggleFavorite } = useStore();
  const productPath = product.brandSlug && product.category?.slug 
    ? `/${product.brandSlug}/${product.category.slug}/${product.slug}`
    : `/product/${product.slug}`;
    
  const isFavorite = favorites.includes(product.id);

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1 relative">
      {/* Favorite Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(product.id);
        }}
        className={`absolute top-4 left-4 z-10 p-2.5 rounded-full transition-colors touch-target bg-white shadow-sm border border-slate-100 ${isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
        aria-label="المفضلة"
      >
        <Heart size={18} className={isFavorite ? 'fill-red-500' : ''} />
      </button>

      {/* Discount Badge */}
      {product.discountPrice && (
        <span className="absolute top-4 right-4 z-10 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
          خصم
        </span>
      )}

      <Link href={productPath} className="relative aspect-[4/3] bg-[#f8f9fb] p-6 flex items-center justify-center overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out" 
        />
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <span className="text-blue-600 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
          {product.brand}
        </span>
        <Link href={productPath} className="flex-1 mb-4">
          <h3 className="font-display font-bold text-[#0a1220] text-sm md:text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-col gap-3 mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg md:text-xl text-[#0a1220] leading-none">
              {formatMoney(product.price)}
            </span>
            {product.discountPrice && (
              <del className="text-xs text-slate-400 font-semibold line-through">
                {formatMoney(product.regularPrice)}
              </del>
            )}
          </div>
          <button 
            onClick={() => addToCart(product)}
            className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#f0f4f8] text-sm font-bold text-slate-700 transition-all active:scale-[0.98] hover:bg-[#0a1220] hover:text-white group-hover:bg-blue-600 group-hover:text-white"
          >
            <Plus size={16} />
            إضافة سريعة
          </button>
        </div>
      </div>
    </div>
  );
}
