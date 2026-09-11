import { useStore } from '@/lib/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { useLocation } from 'wouter';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useGetStoreSeo } from '@workspace/api-client-react';
import { useEffect } from 'react';

export default function CategoryView({ params }: { params: { slug: string } }) {
  const { products, categories, brands, isLoading } = useStore();
  const slug = params.slug;
  const [location] = useLocation();
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sort, setSort] = useState('recommended');

  const isBrandView = brands.some(b => b.slug === slug);
  const isCategoryView = categories.some(c => c.slug === slug);
  
  // If it's a known brand, use brand view. If known category, use category view.
  // Otherwise, it might be a subcategory or fallback to 404 (handled loosely here by showing empty)
  const viewType = isBrandView ? 'brand' : isCategoryView ? 'category' : 'unknown';
  
  const entityName = isBrandView 
    ? brands.find(b => b.slug === slug)?.name 
    : categories.find(c => c.slug === slug)?.name || slug;
  const { data: seo } = useGetStoreSeo({ type: isBrandView ? 'brand' : 'category', slug });
  useEffect(() => {
    if (seo?.title) document.title = seo.title;
  }, [seo?.title]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    if (viewType === 'brand') {
      result = result.filter(p => p.brandSlug === slug);
    } else if (viewType === 'category') {
      result = result.filter(p => p.category?.slug === slug);
      if (selectedBrands.length > 0) {
        result = result.filter(p => p.brandSlug && selectedBrands.includes(p.brandSlug));
      }
    } else {
      result = [];
    }

    if (sort === 'price-asc') {
      result.sort((a, b) => (a.discountPrice ?? a.regularPrice) - (b.discountPrice ?? b.regularPrice));
    } else if (sort === 'price-desc') {
      result.sort((a, b) => (b.discountPrice ?? b.regularPrice) - (a.discountPrice ?? a.regularPrice));
    }

    return result;
  }, [products, slug, viewType, selectedBrands, sort]);

  // Extract relevant brands for this category filter
  const relevantBrands = useMemo(() => {
    if (viewType !== 'category') return [];
    const categoryProducts = products.filter(p => p.category?.slug === slug);
    const brandSlugs = new Set(categoryProducts.map(p => p.brandSlug).filter(Boolean));
    return brands.filter(b => brandSlugs.has(b.slug));
  }, [products, slug, viewType, brands]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const toggleBrand = (brandSlug: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandSlug) 
        ? prev.filter(b => b !== brandSlug)
        : [...prev, brandSlug]
    );
  };

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-card border-b py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              {seo?.h1 || entityName}
            </h1>
            <p className="text-muted-foreground font-medium">
              يعرض كتالوج CABL حاليًا {filteredProducts.length} منتج ضمن {entityName}.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters - Only show brands filter if in category view */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-card border rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 font-black text-lg mb-6 pb-4 border-b">
                <Filter className="w-5 h-5" />
                تصفية النتائج
              </div>

              {viewType === 'category' && relevantBrands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-sm mb-4 text-muted-foreground">الماركات</h3>
                  <div className="space-y-3">
                    {relevantBrands.map(brand => (
                      <label key={brand.slug} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(brand.slug) ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-input group-hover:border-primary'}`}>
                          {selectedBrands.includes(brand.slug) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-card p-4 rounded-2xl border">
              <span className="font-bold text-sm text-muted-foreground">
                عرض {filteredProducts.length} منتج
              </span>
              
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <select 
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="bg-transparent text-sm font-bold border-none outline-none cursor-pointer"
                >
                  <option value="recommended">المقترحة</option>
                  <option value="price-asc">السعر: من الأقل للأعلى</option>
                  <option value="price-desc">السعر: من الأعلى للأقل</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-card border rounded-2xl p-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="font-black text-xl mb-2">لا توجد منتجات</h3>
                <p className="text-muted-foreground font-medium">لم نتمكن من العثور على أي منتجات تطابق معايير البحث.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
