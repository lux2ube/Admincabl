import { useStore } from '@/lib/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Link } from 'wouter';
import { ArrowLeft, Zap, PackageCheck, Truck } from 'lucide-react';
import { useGetStoreSeo } from '@workspace/api-client-react';
import { useEffect } from 'react';
import { safeCatalogText } from '@/lib/safe-catalog-text';

export default function Home() {
  const { products, categories, brands, currencies, shippingOptions, isLoading } = useStore();

  const { data: seo } = useGetStoreSeo({ type: 'home' });

  // Update title manually for this simplified setup since we are not using a dedicated SEO Head component
  useEffect(() => {
    document.title = seo?.title || "CABL";
  }, [seo?.title]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const featuredProducts = products.slice(0, 8);
  const newArrivals = [...products].reverse().slice(0, 4);
  const heroProduct = featuredProducts[0];
  const latestProduct = newArrivals[0];
  const productHref = (product: typeof heroProduct) => product
    ? `/${product.brandSlug || 'products'}/${product.category?.slug || 'catalog'}/${product.slug}`
    : '/search';

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-primary/5 border-b overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 max-w-xl">
              <span className="inline-block py-1.5 px-3 rounded-full bg-primary/10 text-primary font-black text-xs tracking-widest uppercase">
                {heroProduct?.brand || categories[0]?.name || 'CABL'}
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.1] tracking-tight">
                {seo?.h1 || heroProduct?.productName || 'كتالوج CABL'}
              </h1>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                {safeCatalogText(heroProduct?.shortDescription) || 'تصفح المنتجات المتاحة في كتالوج CABL الحالي.'}
              </p>
              <div className="flex gap-4 pt-4">
                <Link href={productHref(heroProduct)} className="h-14 px-8 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                  {heroProduct ? 'عرض المنتج' : 'تصفح الكتالوج'}
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* Decorative blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-3xl rounded-full" />
              {heroProduct?.images[0] && (
                <img 
                  src={heroProduct.images[0]} 
                  alt={heroProduct.productName} 
                  className="relative z-10 w-full h-auto rounded-3xl shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500 object-contain bg-white aspect-[4/3]"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border">
            <div className="flex items-center gap-4 md:justify-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1">خيارات الشحن</h3>
                <p className="text-xs text-muted-foreground font-bold">{shippingOptions.length} خيارات من إعدادات المتجر</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:justify-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1">المخزون الحالي</h3>
                <p className="text-xs text-muted-foreground font-bold">{products.filter(product => product.quantity > 0).length} منتج متوفر</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:justify-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1">عملات العرض</h3>
                <p className="text-xs text-muted-foreground font-bold">{currencies.length} عملات بأسعار قاعدة البيانات</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-2">تسوق حسب القسم</h2>
              <p className="text-muted-foreground font-bold text-sm">اختر من الأقسام المتاحة لدينا</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.slice(0, 4).map((cat, i) => (
              <Link key={cat.id} href={`/${cat.slug}`} className="group relative rounded-2xl overflow-hidden aspect-square bg-muted">
                {/* Fallback pattern for categories since we don't have category images in schema */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <div className="absolute inset-0 bg-card p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-lg z-20 group-hover:text-primary transition-colors">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-2">المنتجات المميزة</h2>
              <p className="text-muted-foreground font-bold text-sm">مختارة من {products.length} منتج في الكتالوج الحالي</p>
            </div>
            <Link href="/search" className="hidden sm:flex items-center gap-2 text-sm font-black text-primary hover:text-primary/80 transition-colors">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-10 sm:hidden">
            <Link href="/search" className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-card border font-black text-foreground hover:bg-muted transition-colors">
              عرض كل المنتجات
            </Link>
          </div>
        </div>
      </section>
      
      {/* New Arrivals Banner */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-[2rem] overflow-hidden relative shadow-2xl">
            {latestProduct?.images[0] && <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30" style={{ backgroundImage: `url("${latestProduct.images[0]}")` }} />}
            <div className="relative z-10 px-8 py-16 md:px-16 md:py-24 max-w-2xl text-primary-foreground">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-md text-xs font-black tracking-widest uppercase mb-6 backdrop-blur-sm">
                {latestProduct?.brand || brands[0]?.name || 'CABL'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                {latestProduct?.productName || 'منتجات الكتالوج'}
              </h2>
              <p className="text-primary-foreground/80 font-medium text-lg mb-8 max-w-md">
                {safeCatalogText(latestProduct?.shortDescription) || 'راجع مواصفات المنتج والسعر والمخزون قبل إضافته إلى السلة.'}
              </p>
              <Link href={productHref(latestProduct)} className="inline-flex h-14 px-8 bg-white text-primary font-black rounded-xl items-center justify-center hover:bg-white/90 transition-colors shadow-lg">
                عرض التفاصيل
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
