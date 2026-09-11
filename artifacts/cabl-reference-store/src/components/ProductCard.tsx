import { Link } from 'wouter';
import { useStore } from '@/lib/StoreContext';
import type { StoreProduct } from '@workspace/api-client-react';
import { ShoppingCart, Heart, Check, Package } from 'lucide-react';
import { useState } from 'react';

export function ProductCard({ product }: { product: StoreProduct }) {
  const { formatMoney, addToCart, cartQuantities, toggleFavorite, favorites } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const inCart = (cartQuantities[product.id] || 0) > 0;
  const isFav = favorites.includes(product.id);
  const price = product.discountPrice ?? product.regularPrice;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.regularPrice;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inCart) {
      setIsAdding(true);
      addToCart(product);
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(product.id);
  };

  const href = `/${product.brandSlug || 'brand'}/${product.category?.slug || 'category'}/${product.slug}`;

  return (
    <div className="group bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      {hasDiscount && (
        <span className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
          تخفيض
        </span>
      )}
      
      <button 
        onClick={handleFav}
        className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isFav ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground shadow-sm'}`}
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
      </button>

      <Link href={href} className="block aspect-[4/3] bg-muted/30 p-6 relative overflow-hidden">
        {product.images[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.productName} 
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground" aria-label="لا توجد صورة للمنتج">
            <Package className="h-12 w-12" />
          </span>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          {product.brand && (
            <span className="text-[10px] font-black text-primary/80 uppercase tracking-widest block mb-1">
              {product.brand}
            </span>
          )}
          <Link href={href} className="block group-hover:text-primary transition-colors">
            <h3 className="font-bold text-sm leading-snug line-clamp-2 text-card-foreground">
              {product.productName}
            </h3>
          </Link>
        </div>
        
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div>
            <div className="font-black text-lg text-foreground">
              {formatMoney(price)}
            </div>
            {hasDiscount && (
              <div className="text-xs text-muted-foreground line-through font-bold">
                {formatMoney(product.regularPrice)}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleAdd}
            disabled={inCart || product.quantity <= 0}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              inCart 
                ? 'bg-green-500 text-white' 
                : product.quantity <= 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : inCart ? (
              <Check className="w-5 h-5" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
