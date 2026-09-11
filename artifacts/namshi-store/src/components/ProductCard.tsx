import { Link } from 'wouter';
import { ShoppingBag, Heart } from 'lucide-react';
import { useStore, type Product } from '../lib/StoreContext';

export function ProductCard({ product }: { product: Product }) {
  const { formatMoney, addToCart, favorites, toggleFavorite } = useStore();
  const productPath = product.brandSlug && product.category?.slug 
    ? `/${product.brandSlug}/${product.category.slug}/${product.slug}`
    : `/product/${product.slug}`;
    
  const isFavorite = favorites.includes(product.id);

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-square bg-slate-50 p-6 flex items-center justify-center overflow-hidden">
        <button 
          onClick={() => toggleFavorite(product.id)}
          className={`absolute top-3 left-3 p-2 rounded-full z-10 transition-colors shadow-sm bg-white ${isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
          aria-label="المفضلة"
        >
          <Heart size={16} className={isFavorite ? 'fill-red-500' : ''} />
        </button>
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
        />
        {product.discountPrice && (
          <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            خصم
          </span>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1">
          {product.brand}
        </span>
        <Link href={productPath} className="flex-1">
          <h3 className="font-display font-semibold text-slate-800 text-sm leading-relaxed mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 leading-none">
              {formatMoney(product.price)}
            </span>
            {product.discountPrice && (
              <del className="text-[10px] text-slate-400 font-semibold mt-1">
                {formatMoney(product.regularPrice)}
              </del>
            )}
          </div>
          <button 
            onClick={() => addToCart(product)}
            className="w-10 h-10 rounded-full bg-slate-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors border border-slate-200 hover:border-blue-600"
            aria-label="أضف للسلة"
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
