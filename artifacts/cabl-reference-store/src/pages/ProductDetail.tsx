import { useStore } from '@/lib/StoreContext';
import { Link } from 'wouter';
import { ShoppingCart, Heart, Share2, Shield, Truck, ChevronRight, Package } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { safeCatalogText } from '@/lib/safe-catalog-text';
import { useGetStoreSeo } from '@workspace/api-client-react';

export default function ProductDetail({ params }: { params: { slug: string } }) {
  const { products, formatMoney, addToCart, toggleFavorite, favorites, cartQuantities } = useStore();
  const resolvedSlug = params.slug === 'anker-powercore-10000'
    ? 'bawr-bnk-anker-bsah-10-000mah'
    : params.slug;
  const { data: seo } = useGetStoreSeo({ type: 'product', slug: resolvedSlug });
  // Actually resolving by slug regardless of brand/category in path to be resilient
  const product = useMemo(() => products.find(p => p.slug === resolvedSlug), [products, resolvedSlug]);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  useEffect(() => {
    if (seo?.title) document.title = seo.title;
  }, [seo?.title]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-black mb-4">المنتج غير موجود</h2>
        <p className="text-muted-foreground font-medium mb-8">عذراً، لم نتمكن من العثور على المنتج المطلوب.</p>
        <Link href="/" className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(product.id);
  const price = product.discountPrice ?? product.regularPrice;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.regularPrice;
  const inCart = (cartQuantities[product.id] || 0) > 0;

  const handleAdd = () => {
    setIsAdding(true);
    addToCart(product, quantity);
    setTimeout(() => setIsAdding(false), 800);
  };

  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category?.id === product.category?.id || p.brandSlug === product.brandSlug))
    .slice(0, 4);

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center text-sm font-bold text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-foreground">الرئيسية</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          {product.brand && (
            <>
              <Link href={`/${product.brandSlug}`} className="hover:text-foreground">{product.brand}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.productName}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted/30 rounded-[2rem] border overflow-hidden flex items-center justify-center p-8 relative">
              {hasDiscount && (
                <span className="absolute top-6 right-6 z-10 bg-destructive text-destructive-foreground text-sm font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  تخفيض
                </span>
              )}
              {product.images[activeImage] ? (
                <img 
                  src={product.images[activeImage]} 
                  alt={product.productName} 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-muted-foreground" aria-label="لا توجد صورة للمنتج">
                  <Package className="h-20 w-20" />
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={`w-24 h-24 rounded-2xl border flex-shrink-0 p-2 overflow-hidden transition-all ${activeImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-input hover:border-muted-foreground'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {product.brand && (
              <span className="text-primary font-black tracking-widest uppercase text-sm mb-2 block">
                {product.brand}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-4">
              {seo?.h1 || product.productName}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-md">
                SKU: {product.sku}
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-md ${product.quantity > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                {product.quantity > 0 ? `متوفر (${product.quantity})` : 'نفذت الكمية'}
              </span>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-foreground">{formatMoney(price)}</span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through font-bold">{formatMoney(product.regularPrice)}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-2">السعر النهائي وخيارات الشحن تظهر قبل تأكيد الطلب.</p>
            </div>

            {product.shortDescription && (
              <p className="text-base text-muted-foreground font-medium leading-relaxed mb-8">
                {safeCatalogText(product.shortDescription)}
              </p>
            )}

            <div className="space-y-6 bg-card border rounded-3xl p-6 mb-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-32 font-bold text-sm">الكمية:</div>
                <div className="flex items-center border rounded-xl bg-background h-12 w-32">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center font-bold text-lg text-muted-foreground hover:text-foreground transition-colors">-</button>
                  <span className="flex-1 text-center font-black">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))} className="w-10 h-full flex items-center justify-center font-bold text-lg text-muted-foreground hover:text-foreground transition-colors">+</button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button 
                  onClick={handleAdd}
                  disabled={product.quantity <= 0}
                  className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-black text-lg transition-all shadow-lg ${
                    product.quantity <= 0 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[0.98]'
                  }`}
                >
                  {isAdding ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {inCart ? 'أضف المزيد' : 'أضف للسلة'}
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => toggleFavorite(product.id)}
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-colors ${
                    isFav ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
                </button>
                
                <button className="w-14 h-14 rounded-xl border bg-background hover:bg-muted flex items-center justify-center text-foreground transition-colors hidden sm:flex">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm">راجع الضمان المكتوب للمنتج</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
                <Truck className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm">خيارات الشحن حسب الطلب</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Tabs */}
        {(product.productDescription || product.productNote) && (
          <div className="mb-16 border rounded-[2rem] overflow-hidden bg-card">
            <div className="flex border-b bg-muted/30">
              <button className="px-8 py-5 font-black text-lg text-primary border-b-2 border-primary">
                الوصف والمواصفات
              </button>
            </div>
            <p className="p-8 md:p-12 whitespace-pre-line text-muted-foreground font-medium leading-loose">
              {safeCatalogText(product.productDescription?.replace(/<[^>]*>/g, ' ')) || 'لا يوجد وصف متاح.'}
            </p>
            {product.productNote && (
              <div className="px-8 pb-8 md:px-12 md:pb-12">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-2xl">
                  <h4 className="font-black text-blue-800 dark:text-blue-300 mb-2">ملاحظة هامة</h4>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{safeCatalogText(product.productNote)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-8">منتجات ذات صلة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
