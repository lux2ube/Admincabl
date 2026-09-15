import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen as BookOpenIcon, Check, ChevronLeft, CreditCard, FlaskConical, Headphones, MapPin as MapPinIcon, MessageCircle as MessageCircleIcon, Package, RefreshCcw, Search as SearchIcon, ShieldCheck, SlidersHorizontal, Smartphone, Tag, Truck, X, Zap, Scale } from 'lucide-react';
import { getCompareStoreProductsQueryKey, getGetStoreSeoQueryKey, getGetStoreOrderQueryKey, getListStoreOrdersQueryKey, useCompareStoreProducts, useCreateStoreOrder, useGetStoreOrder, useGetStoreSeo, useListStoreOrders } from '@workspace/api-client-react';
import type { StoreOrderInput, StoreProduct } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';
import { brandCategoryPath, brandPath, catalogImageSrcSet, catalogImageUrl, productPath } from '@/lib/store-routes';
import { getSeoKeywordCluster, seoKeywordClusters } from '@/lib/seo-keywords';
import { absoluteJsonLd, setSeoHead } from '@/lib/seo-head';
import { Breadcrumbs, CTASection, CatalogError, CatalogToolbar, LoadingCatalog, PageHeading } from '@/components/page-parts';
import { CartLine, ProductGrid, QuantityControl } from '@/components/catalog-ui';
import { EditorialSection, FAQList, InfoCards, ProductEditorial, mergeFaqItems } from '@/pages/content-pages';

function SEO({ type, slug }: { type: 'home' | 'category' | 'brand' | 'product'; slug?: string }) {
  const [location, navigate] = useLocation();
  const params = slug ? { type, slug } : { type };
  const isStaticHome = type === 'home' && !slug;
  const { data } = useGetStoreSeo(params, { query: { queryKey: getGetStoreSeoQueryKey(params), enabled: !isStaticHome, staleTime: 60_000 } });
  useEffect(() => {
    if (isStaticHome) {
      setSeoHead({
        title: 'CABL | منتجات الشحن والطاقة والإكسسوارات',
        description: 'تسوق منتجات الشحن والطاقة والإكسسوارات من كتالوج CABL، مع أسعار ومخزون وخيارات شحن مأخوذة من المتجر.',
        canonicalPath: '/',
      });
      return;
    }
    if (!data) return;
    if (slug && data.slug && data.slug !== slug) {
      const redirectPath = type === 'product'
        ? data.canonicalPath
        : type === 'category'
          ? `/category/${data.slug}`
          : data.canonicalPath;
      if (location !== redirectPath) navigate(redirectPath);
      return;
    }
    setSeoHead({
      title: data.title,
      description: data.description,
      canonicalPath: data.canonicalPath,
      indexable: data.indexable,
      image: Array.isArray(data.jsonLd?.image) ? String(data.jsonLd.image[0]) : typeof data.jsonLd?.image === 'string' ? data.jsonLd.image : undefined,
        jsonLd: (() => {
        if (!data.breadcrumbs.length || data.entityType === 'home') return data.jsonLd;
          const primary = { ...absoluteJsonLd(data.jsonLd) as Record<string, unknown> };
        delete primary['@context'];
        return {
          '@context': 'https://schema.org',
          '@graph': [
            primary,
            {
              '@type': 'BreadcrumbList',
              itemListElement: data.breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: absoluteJsonLd(item.path),
              })),
            },
          ],
        };
      })(),
    });
  }, [data, isStaticHome, location, navigate, type]);
  return null;
}

function StaticSEO({ title, description, canonicalPath, indexable = true, jsonLd }: { title: string; description: string; canonicalPath?: string; indexable?: boolean; jsonLd?: Record<string, unknown> }) {
  useEffect(() => {
    setSeoHead({ title: `${title} | CABL`, description, canonicalPath, indexable, jsonLd });
  }, [title, description, canonicalPath, indexable, jsonLd]);
  return null;
}

function NoIndex() {
  return <StaticSEO title="CABL" description="صفحة تنقل داخل متجر CABL." indexable={false} />;
}

function ProductImage({
  product,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '100vw',
}: {
  product: StoreProduct;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images?.[0];
  if (!image || imageFailed) {
    return <span className={`${className} product-image-fallback`} role="img" aria-label={product.productName}><Package size={46} /></span>;
  }
  return <img className={className} src={catalogImageUrl(image, 640)} srcSet={catalogImageSrcSet(image)} sizes={sizes} alt={product.productName} loading={loading} fetchPriority={fetchPriority} decoding="async" onError={() => setImageFailed(true)} data-testid={`img-detail-${product.id}`}/>;
}

function BrandCollectionImage({ product, brand }: { product?: StoreProduct; brand: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="brand-collection-image">
    {failed || !product?.images?.[0]
      ? <span className="brand-collection-fallback" aria-hidden="true">{brand.slice(0, 1)}</span>
      : <img src={catalogImageUrl(product.images[0], 320)} srcSet={catalogImageSrcSet(product.images[0], [160, 320, 480])} sizes="160px" alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />}
  </span>;
}

function LegacyHomePage() {
  const { catalog, isLoading, isError } = useStore();
  const [, navigate] = useLocation();
  const products = catalog?.products || [];
  const featured = useMemo(() => [...products].sort((a, b) => Number(Boolean(b.discountPrice)) - Number(Boolean(a.discountPrice))).slice(0, 8), [products]);
  const categories = useMemo(() => Array.from(new Map(products.filter((item) => item.category).map((item) => [item.category!.slug, item.category!])).values()).slice(0, 3), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((item) => item.brand))).slice(0, 5), [products]);
  const heroProduct = products[0];
  return <><SEO type="home"/><section className="hero"><div className="container hero-inner"><div className="hero-copy reveal"><span className="eyebrow">CABL / اليمن</span><h1>اتصالك. <span>طاقتك.</span><br/>على طريقتك.</h1><p>إكسسوارات تقنية منتقاة بعناية، بأسعار واضحة وتوصيل يعتمد عليه إلى كل مدن اليمن.</p><div className="hero-actions"><Link href="/search" className="button button-primary" data-testid="link-hero-shop">تسوّق الكتالوج <ArrowLeft size={17}/></Link><Link href="/orders" className="button button-quiet" data-testid="link-hero-orders">تتبع طلبك</Link></div></div><div className="hero-art reveal">{heroProduct ? <ProductImage product={heroProduct}/> : <div className="hero-fallback"><Zap size={70}/></div>}<div className="hero-badge"><i/> مختارات تصلح للاستخدام اليومي</div></div></div></section><section className="trust-row"><div className="container trust-grid"><div className="trust-item"><ShieldCheck/><div><strong>اختيارات موثوقة</strong><span>بيانات المنتج كما هي</span></div></div><div className="trust-item"><Truck/><div><strong>توصيل داخل اليمن</strong><span>اختر الطريقة الأنسب لك</span></div></div><div className="trust-item"><Package/><div><strong>تجربة شراء واضحة</strong><span>تأكيد ومتابعة بعد الطلب</span></div></div></div></section><section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">من الكتالوج</span><h2>قطع تستحق مكاناً في حقيبتك</h2><p>كل منتج هنا قادم من مخزون CABL المنشور.</p></div><Link href="/search" data-testid="link-featured-all">رؤية الكل <ArrowLeft size={15}/></Link></div>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <ProductGrid products={featured}/>}</div></section><section className="editorial-choice"><div className="container"><div className="editorial-heading"><span className="eyebrow">ابدأ من المشكلة</span><h2>قطعة مناسبة تبدأ بسؤال واضح</h2><p>اختر المسار الأقرب لاستخدامك، ثم راجع البيانات قبل الشراء.</p></div><div className="choice-grid"><Link href="/solutions/slow-car-charging"><Zap/><strong>الشحن البطيء في السيارة</strong><span>حل عملي للشاحن والكابل والحرارة</span></Link><Link href="/blog/best-power-bank-yemen"><BookOpenIcon/><strong>أحتاج طاقة احتياطية</strong><span>دليل اختيار باور بانك مناسب</span></Link><Link href="/locations/yemen"><MapPinIcon/><strong>أين يصل طلبي؟</strong><span>راجع خيارات الشحن والتوصيل</span></Link></div></div></section><section className="brand-strip"><div className="container"><div className="section-heading"><div><span className="eyebrow">العلامات المتاحة</span><h2>أسماء نعرفها</h2></div><Link href="/search?view=brands" data-testid="link-brands-all">كل العلامات <ArrowLeft size={15}/></Link></div><div className="brand-list">{brands.map((brand) => <Link href={`/brand/${products.find((product) => product.brand === brand)?.brandSlug || brand.toLowerCase()}`} className="brand-pill" key={brand} data-testid={`link-brand-${brand}`}>{brand}</Link>)}</div></div></section><section className="category-band"><div className="container"><div className="section-heading"><div><span className="eyebrow">اختر ما تحتاجه</span><h2>طريق أقصر للقطعة المناسبة</h2></div></div><div className="category-grid">{categories.map((category, index) => <Link href={`/category/${category.slug}`} className="category-tile" key={category.slug} data-testid={`link-category-${category.slug}`}><span><strong>0{index + 1}</strong></span><h3>{category.name}</h3><p>تصفح المنتجات المتاحة</p>{index === 0 ? <Zap size={36}/> : index === 1 ? <Smartphone size={34}/> : <Headphones size={35}/>}</Link>)}</div></div></section><section className="home-editorial-links"><div className="container"><div><span className="eyebrow">محتوى CABL</span><h2>أسئلة صغيرة قبل قرار أكبر</h2><p>دليل الشراء والسياسات والمواصفات في مكان واحد.</p></div><div className="inline-link-list"><Link href="/about">من نحن <ArrowLeft size={14}/></Link><Link href="/lab">مركز المواصفات <ArrowLeft size={14}/></Link><Link href="/faq">الأسئلة الشائعة <ArrowLeft size={14}/></Link><Link href="/return-policy">الإرجاع والاستبدال <ArrowLeft size={14}/></Link></div></div></section><CTASection/></>;
}

function GuidedHomePage() {
  const { catalog, isLoading, isError } = useStore();
  const products = catalog?.products || [];
  const inStockProducts = useMemo(() => products.filter((product) => product.quantity > 0), [products]);
  const categories = useMemo(
    () => Array.from(new Map(products.filter((product) => product.category).map((product) => [product.category!.slug, product.category!])).values()),
    [products],
  );
  const brands = useMemo(
    () => Array.from(new Map(products.map((product) => [product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-'), product])).values()),
    [products],
  );
  const heroProduct = inStockProducts[0];
  const categoryFor = (matcher: RegExp) => categories.find((category) => matcher.test(`${category.slug} ${category.name}`)) || categories[0];
  const chargerCategory = categoryFor(/charg|شاحن/i);
  const cableCategory = categoryFor(/cable|كابل/i);
  const powerCategory = categoryFor(/power|باور|طاقة/i);

  return (
    <div className="guided-home">
      <SEO type="home" />
      <section className="guided-hero">
        <div className="container guided-hero-inner">
          <div className="guided-hero-copy reveal">
            <span className="eyebrow">CABL / اليمن</span>
            <h1>ابدأ من جهازك.<br /><em>اختر القطعة المناسبة.</em></h1>
            <p>تصفح الكتالوج حسب ما تحتاجه، ثم راجع المنفذ والقدرة والتوافق في صفحة المنتج قبل الإضافة إلى السلة.</p>
            <div className="guided-hero-actions">
              <Link href="/search" className="button button-primary" data-testid="link-home-catalog">افتح الكتالوج <ArrowLeft size={16} /></Link>
              <Link href="/orders" className="button button-quiet" data-testid="link-home-track-order">تتبع طلبك</Link>
            </div>
            <div className="guided-hero-note"><ShieldCheck size={15} /> السعر والتوافر من الكتالوج الحالي</div>
          </div>
          <div className="guided-hero-product reveal">
            {heroProduct ? (
              <Link href={productPath(heroProduct)} className="guided-hero-product-card" data-testid={`link-home-hero-product-${heroProduct.id}`}>
                <span className="guided-hero-index">01 / الكتالوج</span>
                <ProductImage product={heroProduct} className="guided-hero-product-image" loading="lazy" fetchPriority="low" sizes="(max-width: 767px) 330px, 420px" />
                <span className="guided-hero-product-label">
                  <span>{heroProduct.brand}</span>
                  <strong>{heroProduct.productName}</strong>
                </span>
              </Link>
            ) : (
              <div className="guided-hero-product-card" data-testid="state-home-hero-empty">
                <Package size={46} color="#1757ee" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="guided-path" aria-label="خطوات الاختيار">
        <div className="container guided-path-inner">
          <div className="guided-path-intro">
            <span className="eyebrow">مسار الشراء</span>
            <h2>ثلاث خطوات قبل الإضافة</h2>
          </div>
          {[
            ['01', 'حدد القسم', 'شاحن، كابل، طاقة أو ملحق'],
            ['02', 'راجع البيانات', 'المنفذ والقدرة والتوافق'],
            ['03', 'أكمل الطلب', 'السلة ثم العنوان والدفع'],
          ].map(([number, title, text]) => (
            <div className="guided-step" key={number} data-testid={`step-home-purchase-${number}`}>
              <span className="guided-step-number">{number}</span>
              <div><strong>{title}</strong><span>{text}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="guided-section">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">اختر من احتياجك</span>
              <h2>أقسام الكتالوج</h2>
              <p>طريق مختصر إلى المنتجات المنشورة والمتاحة حالياً.</p>
            </div>
            <Link href="/search" data-testid="link-home-categories-all">كل المنتجات <ArrowLeft size={15} /></Link>
          </div>
          {isLoading ? (
            <div className="guided-category-grid" data-testid="loading-home-categories">
              {Array.from({ length: 5 }).map((_, index) => <div className="guided-category-card skeleton" key={index} />)}
            </div>
          ) : categories.length ? (
            <div className="guided-category-grid">
              {categories.slice(0, 5).map((category, index) => (
                <Link href={`/category/${category.slug}`} className="guided-category-card" key={category.slug} data-testid={`link-home-category-${category.slug}`}>
                  <span className="guided-category-icon guided-category-c" aria-hidden="true">C</span>
                  <strong>{category.name}</strong>
                  <span>استعرض القسم <ArrowLeft size={13} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="empty-home-categories"><h3>ستظهر الأقسام مع تحميل الكتالوج</h3></div>
          )}
        </div>
      </section>

      <section className="guided-section guided-catalog">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">من الكتالوج الحالي</span>
              <h2>منتجات متاحة الآن</h2>
              <p>افتح صفحة المنتج لمراجعة التفاصيل قبل اختيار الكمية.</p>
            </div>
            <Link href="/search" data-testid="link-home-products-all">استعرض الكتالوج <ArrowLeft size={15} /></Link>
          </div>
          {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={() => window.location.reload()} /> : <ProductGrid products={inStockProducts.slice(0, 8)} empty="لا توجد منتجات متاحة حالياً." />}
        </div>
      </section>

      <section className="guided-decision">
        <div className="container guided-decision-grid">
          <div className="guided-decision-copy">
            <span className="eyebrow">لو تعرف ما تحتاجه</span>
            <h2>اذهب مباشرة إلى الاستخدام الأقرب.</h2>
            <p>هذه روابط من أقسام الكتالوج، وليست توصيات منفصلة. افتح القسم ثم قارن مواصفات المنتجات المتاحة.</p>
          </div>
          <div className="guided-checklist">
            {[
              { category: chargerCategory, title: 'أحتاج شاحناً', text: 'قدرة ومنافذ تناسب جهازك' },
              { category: cableCategory, title: 'أحتاج كابلاً', text: 'طرفان وطول وتصنيف واضح' },
              { category: powerCategory, title: 'أحتاج طاقة متنقلة', text: 'سعة وقدرة ومنافذ للمقارنة' },
              { category: categories.find((category) => /travel|car|سفر|سيارة/i.test(`${category.slug} ${category.name}`)), title: 'أحتاج ملحق سفر أو سيارة', text: 'اختر من القسم المتاح' },
              ].map(({ category, title, text }, index) => category ? (
              <Link href={`/category/${category.slug}`} className="guided-check" key={`${category.slug}-${index}`} data-testid={`link-home-intent-${index}`}>
                <Check size={17} />
                <span><strong>{title}</strong><br />{text}</span>
                <ArrowLeft size={14} />
              </Link>
            ) : null)}
          </div>
        </div>
      </section>

      <section className="guided-brand-strip">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">العلامات الموجودة في الكتالوج</span>
              <h2>تصفح حسب العلامة</h2>
            </div>
            <Link href="/search?view=brands" data-testid="link-home-brands-all">كل العلامات <ArrowLeft size={15} /></Link>
          </div>
          <div className="guided-brand-list">
            {brands.map((product) => (
              <Link href={brandPath(product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-'))} className="guided-brand-link" key={product.brandSlug || product.brand} data-testid={`link-home-brand-${product.brandSlug || product.brand}`}>
                {product.brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <EditorialSection eyebrow="قبل تأكيد الطلب" title="معلومات تساعدك على الاختيار">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'راجع صفحة المنتج', text: 'طابق الموديل والـSKU والمنافذ والقدرة مع جهازك قبل الإضافة إلى السلة.' },
          { icon: <Zap />, title: 'التوافر قابل للتغير', text: 'الكمية المعروضة من الكتالوج الحالي، ويعاد التحقق منها عند الإضافة والطلب.' },
          { icon: <Truck />, title: 'الشحن يظهر في checkout', text: 'أدخل العنوان واختر طريقة الشحن والدفع قبل إرسال الطلب.' },
          { icon: <RefreshCcw />, title: 'اقرأ سياسة الإرجاع', text: 'راجع الشروط والخطوات في سياسة الإرجاع والاستبدال قبل التأكيد.', href: '/return-policy' },
        ]} />
      </EditorialSection>

      <EditorialSection eyebrow="محتوى CABL" title="اقرأ قبل أن تختار">
        <InfoCards items={[
          { icon: <BookOpenIcon />, title: 'دليل الباور بانك', text: 'قارن السعة والقدرة والمنافذ حسب الاستخدام.', href: '/blog/best-power-bank-yemen' },
          { icon: <FlaskConical />, title: 'مركز المواصفات', text: 'افصل بين البيانات المعلنة والحسابات التوضيحية.', href: '/lab' },
          { icon: <MessageCircleIcon />, title: 'أسئلة الشراء', text: 'راجع الإجابات المختصرة قبل فتح السلة.', href: '/faq' },
        ]} />
      </EditorialSection>

      <EditorialSection title="أسئلة سريعة">
        <FAQList items={[
          { question: 'من أين أبدأ إذا لم أعرف اسم المنتج؟', answer: 'ابدأ من القسم الأقرب لاستخدامك، ثم قارن المواصفات والتوافق في صفحات المنتجات.' },
          { question: 'هل كل ما يظهر في الصفحة متوفر؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح، ويعاد التحقق عند الإضافة والطلب.' },
          { question: 'هل السعر يشمل الشحن؟', answer: 'السعر المعروض للمنتج، وتظهر رسوم الشحن بعد اختيار العنوان والطريقة في checkout.' },
        ]} />
      </EditorialSection>
    </div>
  );
}

function CommercialHomePage() {
  const { catalog, isLoading, isError, homeCategory, selectHomeCategory } = useStore();
  const products = catalog?.products || [];
  const inStockProducts = useMemo(() => products.filter((product) => product.quantity > 0), [products]);
  const categories = catalog?.categories || [];
  const brandCollections = useMemo(
    () => (catalog?.brands || []).map((brand) => ({
      brand: brand.name,
      brandSlug: brand.slug,
      product: products.find((product) => product.brandSlug === brand.slug),
      count: brand.productCount,
    })),
    [catalog, products],
  );
  const heroBrands = useMemo(() => {
    const vention = brandCollections.find(({ brand }) => brand.toLowerCase().includes('vention'));
    const remaining = brandCollections.filter(({ brand }) => !vention || brand !== vention.brand);
    return [...(vention ? [vention] : []), ...remaining].slice(0, 4);
  }, [brandCollections]);
  const [quickBrand, setQuickBrand] = useState('');
  const [quickCategory, setQuickCategory] = useState(homeCategory || 'chargers');
  useEffect(() => {
    setQuickCategory(homeCategory || 'chargers');
  }, [homeCategory]);
  const chooseCategory = (category: string) => {
    setQuickCategory(category);
    selectHomeCategory(category);
  };
  const chooseAllCategories = () => {
    setQuickCategory('');
    selectHomeCategory(null);
  };
  const quickMatches = useMemo(
    () => products.filter((product) => (!quickBrand || product.brand === quickBrand) && (!quickCategory || product.category?.slug === quickCategory)),
    [products, quickBrand, quickCategory],
  );
  const needs = useMemo(() => {
    const used = new Set<string>();
    const options = [
      { match: /(?:^|-)chargers(?:\s|$)|الشواحن|شواحن/i, title: 'تحتاج شاحن سريع؟', text: 'شواحن', icon: <Zap size={20} /> },
      { match: /cable|كابل|وصلة/i, title: 'تحتاج وصلة شحن قوية؟', text: 'كابلات', icon: <Package size={20} /> },
      { match: /power|باور|طاقة|battery|بطار/i, title: 'تحتاج جوالك يبقى شغال طول اليوم؟', text: 'بور بانك', icon: <Zap size={20} /> },
      { match: /wireless-earbuds|سماعات أذن|سماعات لاسلكية/i, title: 'تحتاج صوت يعدل مزاجك؟', text: 'سماعات أذن لاسلكية', icon: <Headphones size={20} /> },
      { match: /microphone|mic|wireless-microphones|مايك|ميكروفون|صوت/i, title: 'صانع محتوى وتريد صوت احترافي؟', text: 'مايكروفونات لاسلكية', icon: <Headphones size={20} /> },
      { match: /car|سيارة|سفر|travel/i, title: 'تحتاج شحن سريع للسيارة؟', text: 'cars', icon: <Truck size={20} /> },
      { match: /accessor|ملحق|توصيل|connect|adapter/i, title: 'تحتاج توصيل بين أجهزتك؟', text: 'الملحقات', icon: <Package size={20} /> },
    ];
    const selected = options.flatMap((option) => {
      const category = categories.find((item) => !used.has(item.slug) && option.match.test(`${item.slug} ${item.name}`));
      if (!category) return [];
      used.add(category.slug);
      const product = products.find((item) => item.category?.slug === category.slug && item.images?.[0]);
      return [{ category, title: option.title, text: option.text, icon: option.icon, product }];
    });
    categories.forEach((category) => {
      if (selected.length >= 5 || used.has(category.slug)) return;
      used.add(category.slug);
      const product = products.find((item) => item.category?.slug === category.slug && item.images?.[0]);
      selected.push({ category, title: category.name, text: 'منتجات منشورة في هذا القسم', icon: <Package size={20} />, product });
    });
     return selected.slice(0, 6);
  }, [categories, products]);
  return (
    <div className="guided-home">
      <SEO type="home" />

      <section className="reference-hero">
        <div className="container reference-hero-inner">
          <div className="reference-hero-copy">
            <span className="eyebrow">CABL / اليمن</span>
            <h1>أصلي يعيش معك..<br /><em>وتورّثه لعيالك.</em></h1>
            <p>منتجات أصلية من براندات تعرفها، تستاهل مكانها على طاولتك.</p>
            <Link href="/search" className="reference-hero-cta" data-testid="link-home-hero-cta">
              تسوّق المنتجات <ArrowLeft size={16} />
            </Link>
            <div className="reference-hero-note"><ShieldCheck size={15} /> اختيارات من كتالوج CABL الحالي</div>
          </div>
          <div className="reference-hero-media">
             <div className="hero-illustration" aria-label="رسم توضيحي للشحن والطاقة والاتصال">
               <span className="hero-c-watermark" aria-hidden="true">C</span>
               <svg className="hero-illustration-svg" viewBox="0 0 620 450" role="img" aria-label="رسم تجريدي للطاقة والاتصال">
                <defs>
                  <linearGradient id="hero-abstract-blue" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#1761ed" />
                    <stop offset="1" stopColor="#64dfe5" />
                  </linearGradient>
                  <linearGradient id="hero-abstract-cyan" x1="0" x2="1" y1="1" y2="0">
                    <stop offset="0" stopColor="#35cbd8" />
                    <stop offset="1" stopColor="#1761ed" />
                  </linearGradient>
                  <radialGradient id="hero-abstract-core">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset=".55" stopColor="#dff6f8" />
                    <stop offset="1" stopColor="#a7dce8" stopOpacity="0" />
                  </radialGradient>
                  <filter id="hero-abstract-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>
                </defs>
                <ellipse cx="310" cy="350" rx="220" ry="35" fill="#b8d9ec" opacity=".55" />
                <circle cx="310" cy="220" r="125" fill="url(#hero-abstract-core)" filter="url(#hero-abstract-glow)" opacity=".85" />
                <circle cx="310" cy="220" r="135" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity=".85" />
                <circle cx="310" cy="220" r="176" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 15" opacity=".8" />
                <path d="M91 273c54-8 73-54 105-104 36-57 72-70 111-37 42 36 39 92-4 123-47 34-92 10-107-29" fill="none" stroke="url(#hero-abstract-blue)" strokeWidth="15" strokeLinecap="round" opacity=".9" />
                <path d="M529 166c-56 8-73 54-105 104-36 57-72 70-111 37-42-36-39-92 4-123 47-34 92-10 107 29" fill="none" stroke="url(#hero-abstract-cyan)" strokeWidth="15" strokeLinecap="round" opacity=".85" />
                <path d="M173 136c34-54 86-75 137-45 45 26 63 78 39 123-26 49-90 61-133 25" fill="none" stroke="#173653" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 13" opacity=".52" />
                <path d="M447 304c-34 54-86 75-137 45-45-26-63-78-39-123 26-49 90-61 133-25" fill="none" stroke="#173653" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 13" opacity=".38" />
                <circle cx="310" cy="220" r="52" fill="#f9fdff" stroke="#cae9f0" strokeWidth="3" />
                <circle cx="310" cy="220" r="34" fill="url(#hero-abstract-blue)" opacity=".95" />
                <path d="M319 186l-24 39h21l-9 30 31-42h-20l14-27z" fill="#fff" />
                <circle cx="116" cy="271" r="12" fill="#fff" stroke="#1761ed" strokeWidth="4" />
                <circle cx="506" cy="166" r="12" fill="#fff" stroke="#35cbd8" strokeWidth="4" />
                <circle cx="198" cy="117" r="8" fill="#fff" stroke="#173653" strokeWidth="3" />
                <circle cx="423" cy="321" r="8" fill="#fff" stroke="#173653" strokeWidth="3" />
              </svg>
              <div className="hero-illustration-brands" aria-hidden="true">
                {heroBrands.map(({ brand }) => <span key={brand}>{brand}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="guided-path guided-path-home" aria-label="لماذا يختار العملاء CABL">
        <div className="container guided-path-inner">
          <div className="guided-path-intro">
            <span className="eyebrow">ليش CABL؟</span>
            <h2>اختَر وأنت مطمّن</h2>
            <p>خدمة واضحة من أول سؤال إلى ما بعد استلام طلبك.</p>
          </div>
          <div className="guided-path-home-cards">
            {[
              { number: '01', title: 'نساعدك تختار', text: 'نساعدك بخبرة تختار المنتج اللي يناسب جهازك بالضبط.' },
              { number: '02', title: 'منتجات أصلية فقط', text: 'منتجات فاخرة من براندات عالمية معروفة.' },
              { number: '03', title: 'نوصل لباب بيتك', text: 'نوصل لجميع المحافظات اليمنية.' },
              { number: '04', title: 'معك حتى بعد الشراء', text: 'ضمان، خدمة ما بعد البيع، وإمكانية الإرجاع والاستبدال.' },
            ].map(({ number, title, text }) => (
              <div className="guided-step" key={number} data-testid={`step-home-confidence-${number}`}>
                <div className="guided-step-head">
                  <span className="guided-step-number">{number}</span>
                </div>
                <div className="guided-step-copy"><strong>{title}</strong><span>{text}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="guided-needs-section" aria-labelledby="home-needs-title">
        <div className="container">
          <div className="guided-needs-header">
            <div>
              <span className="eyebrow">تسوّق حسب الحاجة</span>
               <h2 id="home-needs-title">ايش ناقص عليك اليوم؟</h2>
              <p>ابدأ من الاستخدام الأقرب لك، ثم قارن المنتجات المنشورة في القسم.</p>
            </div>
            <Link href="/search" className="guided-needs-all" data-testid="link-home-categories-all">كل المنتجات <ArrowLeft size={15} /></Link>
          </div>
          {isLoading ? (
            <div className="guided-needs-grid" data-testid="loading-home-categories">
              {Array.from({ length: 5 }).map((_, index) => <div className="guided-need-card skeleton" key={index} />)}
            </div>
          ) : needs.length ? (
            <div className="guided-needs-grid">
              {needs.map(({ category, title, product }) => (
                <Link href={`/category/${category.slug}`} className="guided-need-card" key={category.slug} data-testid={`link-home-need-${category.slug}`}>
                  <span className="guided-need-media" aria-hidden="true">
                    {product ? <ProductImage product={product} className="guided-need-product-image" sizes="180px" /> : null}
                  </span>
                  <span className="guided-need-content">
                    <span className="guided-need-copy"><strong>{title}</strong></span>
                    <span className="guided-need-footer">{category.name} <ArrowLeft size={13} /></span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="empty-home-categories"><h3>ستظهر الأقسام مع تحميل الكتالوج</h3></div>
          )}
        </div>
      </section>

      <section className="guided-quick-access guided-home-catalog" aria-labelledby="home-quick-access-title">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">الكتالوج الكامل</span>
              <h2 id="home-quick-access-title">كل المنتجات في مكان واحد</h2>
              <p>استخدم أزرار العلامة والقسم لتصفية المنتجات مباشرة داخل الصفحة.</p>
            </div>
            <span className="guided-finder-result-count">{quickMatches.length} منتج مطابق</span>
          </div>
          {isLoading ? (
            <div className="quick-access-loading skeleton" aria-label="جارٍ تحميل خيارات الكتالوج" />
          ) : isError ? (
            <CatalogError retry={() => window.location.reload()} />
          ) : (
            <>
              <div className="guided-quick-access-grid">
                <fieldset className="guided-quick-fieldset">
                  <legend>العلامة التجارية</legend>
                  <div className="guided-finder-options">
                    <button type="button" aria-pressed={!quickBrand} className={!quickBrand ? 'is-selected' : ''} onClick={() => setQuickBrand('')}>كل العلامات</button>
                    {brandCollections.map(({ brand }) => (
                      <button type="button" aria-pressed={quickBrand === brand} className={quickBrand === brand ? 'is-selected' : ''} key={brand} onClick={() => setQuickBrand(quickBrand === brand ? '' : brand)}>{brand}</button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="guided-quick-fieldset">
                  <legend>القسم</legend>
                  <div className="guided-finder-options">
                    <button type="button" aria-pressed={!quickCategory} className={!quickCategory ? 'is-selected' : ''} onClick={chooseAllCategories}>كل الأقسام</button>
                    {categories.map((category) => (
                      <button type="button" aria-pressed={quickCategory === category.slug} className={quickCategory === category.slug ? 'is-selected' : ''} key={category.slug} onClick={() => chooseCategory(category.slug)}>{category.name}</button>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="guided-quick-summary">
                <div>
                  <strong>{quickBrand || 'كل العلامات'}{quickCategory ? ` · ${categories.find((category) => category.slug === quickCategory)?.name || quickCategory}` : ''}</strong>
                  <span>{quickMatches.length ? 'تظهر النتائج من الكتالوج الحالي فقط.' : 'لا توجد منتجات مطابقة لهذا الاختيار حالياً.'}</span>
                </div>
              </div>
              <div className="guided-home-catalog-results">
                {quickMatches.length > 0 && <div className="guided-home-catalog-results-heading"><span>نتائج التصفية المباشرة</span><strong>{quickMatches.length} منتج</strong></div>}
                <ProductGrid products={quickMatches} empty="لا توجد منتجات مطابقة لهذا الاختيار حالياً." />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="guided-brand-strip" aria-labelledby="home-brands-title">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">من الكتالوج الحالي</span>
              <h2 id="home-brands-title">استكشف حسب العلامة</h2>
              <p>كل رابط يفتح صفحة العلامة الفعلية ومنتجاتها المنشورة.</p>
            </div>
            <Link href="/search?view=brands" data-testid="link-home-brands-all">كل العلامات <ArrowLeft size={15} /></Link>
          </div>
          <div className="guided-brand-list">
            {brandCollections.map(({ brand, brandSlug, product, count }) => (
              <Link href={brandPath(brandSlug)} className="guided-brand-collection" key={brandSlug} data-testid={`link-home-brand-${brandSlug}`}>
                <BrandCollectionImage product={product} brand={brand} />
                <span><strong>{brand}</strong><small>{count} {count === 1 ? 'منتج منشور' : 'منتجات منشورة'}</small></span>
                <ArrowLeft size={15} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <EditorialSection eyebrow="تحقق قبل الإضافة" title="ما الذي تراجعه قبل تأكيد الطلب؟">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'طابق بيانات المنتج', text: 'راجع الموديل والـSKU والمنافذ والقدرة مع جهازك قبل الإضافة إلى السلة.' },
          { icon: <Zap />, title: 'التوافر قابل للتغير', text: 'الكمية المعروضة من الكتالوج الحالي، ويعاد التحقق منها عند الإضافة والطلب.' },
          { icon: <Truck />, title: 'الشحن في checkout', text: 'أدخل العنوان واختر طريقة الشحن والدفع قبل إرسال الطلب.' },
          { icon: <RefreshCcw />, title: 'سياسة الإرجاع', text: 'راجع الشروط والخطوات في سياسة الإرجاع والاستبدال قبل التأكيد.', href: '/return-policy' },
        ]} />
      </EditorialSection>

      <EditorialSection eyebrow="أدلة مفيدة" title="اقرأ قبل أن تختار">
        <InfoCards items={[
          { icon: <BookOpenIcon />, title: 'دليل الباور بانك', text: 'قارن السعة والقدرة والمنافذ حسب الاستخدام.', href: '/blog/best-power-bank-yemen' },
          { icon: <FlaskConical />, title: 'مركز المواصفات', text: 'افصل بين البيانات المعلنة والحسابات التوضيحية.', href: '/lab' },
          { icon: <MessageCircleIcon />, title: 'أسئلة الشراء', text: 'راجع الإجابات المختصرة قبل فتح السلة.', href: '/faq' },
        ]} />
      </EditorialSection>

      <EditorialSection eyebrow="أسئلة قبل الشراء" title="إجابات سريعة">
        <FAQList items={[
          { question: 'من أين أبدأ إذا لم أعرف اسم المنتج؟', answer: 'ابدأ من الاحتياج أو القسم الأقرب لاستخدامك، ثم قارن المواصفات والتوافق في صفحات المنتجات.' },
          { question: 'هل كل ما يظهر في الصفحة متوفر؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح، ويعاد التحقق عند الإضافة والطلب.' },
          { question: 'هل السعر يشمل الشحن؟', answer: 'السعر المعروض للمنتج، وتظهر رسوم الشحن بعد اختيار العنوان والطريقة في checkout.' },
        ]} />
      </EditorialSection>

      <EditorialSection eyebrow="عن CABL" title="متجر يساعدك على الاختيار">
        <div className="editorial-copy">
          <p>نعرض منتجات الشحن والطاقة والإكسسوارات من الكتالوج المنشور، مع معلومات تساعدك على مراجعة الموديل والسعر والتوافر قبل الطلب.</p>
          <p>إذا لم تكن متأكداً، ابدأ من الاستخدام ثم راجع صفحة المنتج وسياسات الشحن والإرجاع قبل التأكيد.</p>
          <Link href="/about" className="button button-quiet">اعرف أكثر عن CABL <ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
    </div>
  );
}

export function HomePage() {
  return <CommercialHomePage />;
}

function BrandStorefrontPage({ slug }: { slug: string }) {
  const { catalog, isLoading, isError } = useStore();
  const products = catalog?.products || [];
  const seoParams = { type: 'brand' as const, slug };
  const { data: brandSeo } = useGetStoreSeo(seoParams, {
    query: { queryKey: getGetStoreSeoQueryKey(seoParams), enabled: Boolean(slug), staleTime: 60_000 },
  });
  const brandProducts = useMemo(
    () => products.filter((product) => product.brandSlug === slug || product.brand.toLowerCase().replace(/\s+/g, '-') === slug),
    [products, slug],
  );
  const brandName = brandSeo?.h1 || brandProducts[0]?.brand || slug.replaceAll('-', ' ');
  const categories = useMemo(
    () => Array.from(new Map(
      brandProducts
        .filter((product) => product.category)
        .map((product) => [product.category!.slug, product.category!]),
    ).values()),
    [brandProducts],
  );
  const availableProducts = brandProducts.filter((product) => product.quantity > 0).length;
  const brandDescription = brandSeo?.description || `منتجات ${brandName} المنشورة حالياً في كتالوج CABL. ابدأ من القسم الأقرب لاستخدامك، ثم راجع الموديل والمواصفات والتوافر قبل الطلب.`;
  const technologies = useMemo(() => {
    const evidence = brandProducts
      .flatMap((product) => [product.productName, product.shortDescription, product.productDescription, product.productNote])
      .filter(Boolean)
      .join(' ');
    return [
      { label: 'GaN', pattern: /\bgan\b/i },
      { label: 'PowerIQ', pattern: /\bpoweriq\b/i },
      { label: 'PD', pattern: /(^|[^a-z])pd([^a-z]|$)/i },
      { label: 'PPS', pattern: /(^|[^a-z])pps([^a-z]|$)/i },
      { label: 'Wh', pattern: /(^|[^a-z])wh([^a-z]|$)/i },
      { label: 'USB-C', pattern: /usb[\s-]?c/i },
    ].filter((technology) => technology.pattern.test(evidence));
  }, [brandProducts]);

  if (!isLoading && !isError && brandProducts.length === 0) {
    return (
      <>
        <SEO type="brand" slug={slug} />
        <NoIndex />
        <div className="container brand-empty-page">
          <Breadcrumbs items={[{ label: 'العلامات التجارية', href: '/search?view=brands' }, { label: brandName }]} />
          <div className="state-panel">
            <Package size={30} />
            <h1>لم نجد منتجات منشورة من {brandName}</h1>
            <p>قد تكون العلامة غير متاحة حالياً أو تغيّر رابطها. استعرض العلامات والمنتجات المنشورة من الكتالوج.</p>
            <Link href="/search?view=brands" className="button button-primary">استعرض العلامات <ArrowLeft size={16} /></Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO type="brand" slug={slug} />
      <section className="brand-storefront-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'العلامات التجارية', href: '/search?view=brands' }, { label: brandName }]} />
          <div className="brand-storefront-copy">
            <span className="eyebrow">استكشف العلامة</span>
            <h1>{brandName}</h1>
            <p>{brandDescription}</p>
            <div className="brand-storefront-facts">
              <span><strong>{brandProducts.length}</strong> منتجات منشورة</span>
              <span><strong>{availableProducts}</strong> متاح الآن</span>
            </div>
            <div className="brand-storefront-actions">
              {categories.slice(0, 3).map((category) => (
                <Link className="button button-secondary" href={brandCategoryPath(slug, category.slug)} key={category.slug}>
                  {category.name}
                </Link>
              ))}
              <Link className="button button-primary" href="/search">كل المنتجات <ArrowLeft size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-storefront-section">
        <div className="container">
          <div className="brand-storefront-heading">
            <div>
              <span className="eyebrow">تصفح داخل العلامة</span>
              <h2>اختر القسم قبل الموديل</h2>
              <p>روابط إلى الأقسام التي تحتوي على منتجات منشورة من {brandName} فقط.</p>
            </div>
            <span className="brand-product-count">{brandProducts.length} منتج</span>
          </div>
          {categories.length ? (
            <div className="brand-storefront-category-grid">
              {categories.map((category) => {
                const count = brandProducts.filter((product) => product.category?.slug === category.slug).length;
                return (
                  <Link className="brand-storefront-category" href={brandCategoryPath(slug, category.slug)} key={category.slug}>
                    <strong>{category.name}</strong>
                    <span>{count} {count === 1 ? 'منتج' : 'منتجات'} منشورة</span>
                    <small>{brandProducts.filter((product) => product.category?.slug === category.slug && product.quantity > 0).length} متاح الآن</small>
                    <ArrowLeft size={16} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">لا توجد أقسام منشورة لهذه العلامة حالياً.</p>
          )}
        </div>
      </section>

      <CategoryShoppingSection
        products={brandProducts}
        isLoading={isLoading}
        isError={isError}
        retry={() => window.location.reload()}
        title={`منتجات ${brandName}`}
        empty={`لا توجد منتجات منشورة من ${brandName} حالياً.`}
      />

      <EditorialSection eyebrow="طريقة الاختيار" title={`كيف تختار من ${brandName}؟`}>
        <div className="editorial-copy">
          <p>لا تفترض أن كل منتجات العلامة تؤدي الوظيفة نفسها. ابدأ من الجهاز والاستخدام، ثم قارن الموديل والبيانات الظاهرة والسعر والتوافر في صفحات المنتجات.</p>
        </div>
        <div className="numbered-steps">
          <div><b>01</b><h3>حدد القسم</h3><p>افتح القسم الأقرب لما تريد شراءه بدل مقارنة منتجات مختلفة الوظيفة.</p></div>
          <div><b>02</b><h3>راجع الموديل</h3><p>طابق الاسم ورقم SKU والصورة مع القطعة التي تحتاجها.</p></div>
          <div><b>03</b><h3>قارن المتاح</h3><p>راجع السعر والتوافر والبيانات المعلنة بين الموديلات من القسم نفسه.</p></div>
          <div><b>04</b><h3>أكد الشراء</h3><p>اختر العنوان وطريقة الشحن والدفع في checkout قبل إرسال الطلب.</p></div>
        </div>
      </EditorialSection>

      {technologies.length > 0 && (
        <EditorialSection eyebrow="من بيانات المنتجات" title={`تقنيات ومواصفات ظاهرة في ${brandName}`}>
          <div className="brand-technology-list">
            {technologies.map((technology) => <span key={technology.label}>{technology.label}</span>)}
          </div>
          <p className="content-disclaimer">هذه الكلمات ظهرت في بيانات المنتجات المنشورة لهذه العلامة، وليست قائمة شاملة بمواصفات كل موديل.</p>
        </EditorialSection>
      )}

      <EditorialSection title={`قبل طلب منتج من ${brandName}`}>
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'البيانات أولاً', text: 'العلامة والموديل والسعر والتوافر مأخوذة من الكتالوج الحالي.' },
          { icon: <Zap />, title: 'راجع جهازك', text: 'طابق احتياجك مع البيانات الظاهرة في صفحة المنتج، ولا تعتمد على الاسم وحده.' },
          { icon: <Truck />, title: 'الشحن في checkout', text: 'تظهر خيارات الشحن والرسوم والمدة التقديرية بعد إدخال العنوان.' },
          { icon: <RefreshCcw />, title: 'الإرجاع قبل التأكيد', text: 'راجع سياسة الإرجاع والاستبدال واحتفظ برقم الطلب بعد الشراء.', href: '/return-policy' },
        ]} />
      </EditorialSection>

      <EditorialSection title={`أسئلة عن ${brandName}`}>
        <FAQList items={[
          { question: `هل كل منتجات ${brandName} متاحة الآن؟`, answer: 'التوافر مرتبط بالكمية المنشورة لكل موديل، ويعاد التحقق عند الإضافة والطلب.' },
          { question: `كيف أقارن بين موديلات ${brandName}؟`, answer: 'افتح المنتجات من القسم نفسه وقارن الموديل والمواصفات والسعر والتوافر، لا الاسم التجاري فقط.' },
          { question: 'أين أجد خيارات الشحن والإرجاع؟', answer: 'تظهر خيارات الشحن والدفع في checkout، وتفاصيل الإرجاع في سياسة الإرجاع والاستبدال.' },
        ]} />
      </EditorialSection>

      <EditorialSection title="روابط مفيدة">
        <div className="category-related-links">
          <Link href="/shipping"><Truck /><strong>الشحن والتوصيل</strong><span>راجع الرسوم والمدة حسب العنوان.</span><ArrowLeft size={15} /></Link>
          <Link href="/return-policy"><RefreshCcw /><strong>الإرجاع والاستبدال</strong><span>اعرف الشروط والخطوات قبل الطلب.</span><ArrowLeft size={15} /></Link>
          <Link href="/faq"><MessageCircleIcon /><strong>الأسئلة الشائعة</strong><span>إجابات عن الطلب والدفع والتوافق.</span><ArrowLeft size={15} /></Link>
          <Link href="/search"><Package /><strong>كل المنتجات</strong><span>عد إلى الكتالوج الكامل.</span><ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

function BrandCategoryLinks({ brandSlug, categories }: { brandSlug: string; categories: Array<{ slug: string; name: string }> }) {
  if (!categories.length) return null;
  return (
    <section className="brand-category-nav">
      <div className="container">
        <div className="editorial-heading">
          <span className="eyebrow">تصفح داخل العلامة</span>
          <h2>اختر قسم {brandSlug}</h2>
          <p>صفحة مستقلة لكل علامة وقسم، مع منتجات ومقارنة ونصائح مرتبطة بالاختيار.</p>
        </div>
        <div className="brand-category-nav-grid">
          {categories.map((category) => (
            <Link href={brandCategoryPath(brandSlug, category.slug)} className="brand-category-nav-card" key={category.slug}>
              <strong>{category.name}</strong>
              <span>منتجات {category.name} من هذه العلامة</span>
              <ArrowLeft size={16} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const categorySlugAliases: Record<string, string[]> = {
  cables: ['cables', 'charging-cables'],
  'charging-cables': ['cables', 'charging-cables'],
  'car-accessories': ['car-accessories', 'travel-adapters', 'car-chargers'],
  'travel-adapters': ['car-accessories', 'travel-adapters', 'car-chargers'],
  'phone-accessories': ['phone-accessories', 'hubs-adapters'],
  'hubs-adapters': ['phone-accessories', 'hubs-adapters'],
};

function matchesCategory(product: StoreProduct, categorySlug: string) {
  return categorySlugAliases[categorySlug]?.includes(product.category?.slug || '')
    || product.category?.slug === categorySlug;
}

function guideKeyForCategory(categorySlug: string) {
  if (categorySlug === 'charging-cables') return 'cables';
  if (categorySlug === 'travel-adapters') return 'car-accessories';
  return categorySlug;
}

function keywordClusterForCategory(categorySlug: string) {
  const normalizedSlug = categorySlug === 'cables'
    ? 'charging-cables'
    : categorySlug === 'hubs-adapters'
      ? 'phone-accessories'
      : categorySlug === 'car-accessories'
        ? 'travel-adapters'
        : categorySlug;
  return seoKeywordClusters.find((cluster) => cluster.categorySlug === normalizedSlug);
}

type CategoryPriceBand = {
  id: string;
  min: number;
  max: number;
  label: string;
};

function productPrice(product: StoreProduct) {
  return product.discountPrice ?? product.regularPrice;
}

function categoryBrandKey(product: StoreProduct) {
  return product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-');
}

function categoryPriceBands(products: StoreProduct[], formatPrice: (usd: number) => string): CategoryPriceBand[] {
  const prices = products.map(productPrice).filter((price) => Number.isFinite(price)).sort((a, b) => a - b);
  if (prices.length < 2 || prices[0] === prices[prices.length - 1]) return [];
  const min = prices[0];
  const max = prices[prices.length - 1];
  const step = (max - min) / 3;
  const boundaries = [min, min + step, min + step * 2, max];
  return [
    { id: 'price-low', min: boundaries[0], max: boundaries[1], label: `حتى ${formatPrice(boundaries[1])}` },
    { id: 'price-mid', min: boundaries[1], max: boundaries[2], label: `${formatPrice(boundaries[1])} – ${formatPrice(boundaries[2])}` },
    { id: 'price-high', min: boundaries[2], max: boundaries[3], label: `من ${formatPrice(boundaries[2])}` },
  ];
}

function CategoryFilterFields({
  brands,
  selectedBrands,
  setSelectedBrands,
  stockOnly,
  setStockOnly,
  priceBands,
  selectedPriceBand,
  setSelectedPriceBand,
}: {
  brands: Array<[string, string]>;
  selectedBrands: string[];
  setSelectedBrands: (value: string[]) => void;
  stockOnly: boolean;
  setStockOnly: (value: boolean) => void;
  priceBands: CategoryPriceBand[];
  selectedPriceBand: string;
  setSelectedPriceBand: (value: string) => void;
}) {
  const toggleBrand = (brandSlug: string) => {
    setSelectedBrands(selectedBrands.includes(brandSlug)
      ? selectedBrands.filter((item) => item !== brandSlug)
      : [...selectedBrands, brandSlug]);
  };
  return (
    <>
      {brands.length > 1 && (
        <div className="filter-group">
          <h4>العلامة التجارية</h4>
          {brands.map(([brandSlug, brandName]) => (
            <label className="filter-check" key={brandSlug}>
              <input type="checkbox" checked={selectedBrands.includes(brandSlug)} onChange={() => toggleBrand(brandSlug)} data-testid={`input-category-brand-${brandSlug}`} />
              <span>{brandName}</span>
            </label>
          ))}
        </div>
      )}
      <div className="filter-group">
        <h4>التوافر</h4>
        <label className="filter-check">
          <input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} data-testid="input-category-stock" />
          <span>المتاح الآن فقط</span>
        </label>
      </div>
      {priceBands.length > 0 && (
        <div className="filter-group">
          <h4>نطاق السعر</h4>
          <label className="filter-check">
            <input type="radio" name="category-price" checked={!selectedPriceBand} onChange={() => setSelectedPriceBand('')} data-testid="input-category-price-all" />
            <span>كل الأسعار</span>
          </label>
          {priceBands.map((band) => (
            <label className="filter-check" key={band.id}>
              <input type="radio" name="category-price" checked={selectedPriceBand === band.id} onChange={() => setSelectedPriceBand(band.id)} data-testid={`input-category-price-${band.id}`} />
              <span>{band.label}</span>
            </label>
          ))}
        </div>
      )}
    </>
  );
}

function CategoryFilterPanel({
  mobile = false,
  onClose,
  ...props
}: React.ComponentProps<typeof CategoryFilterFields> & { mobile?: boolean; onClose?: () => void }) {
  const fields = <CategoryFilterFields {...props} />;
  if (mobile) {
    return (
      <div className="category-filter-modal" role="dialog" aria-modal="true" aria-label="تصفية منتجات القسم">
        <button className="category-filter-backdrop" aria-label="إغلاق الفلاتر" onClick={onClose} />
        <div className="category-filter-drawer">
          <div className="category-filter-drawer-head">
            <div><span className="eyebrow">تخصيص النتائج</span><h2>تصفية المنتجات</h2></div>
            <button type="button" onClick={onClose} aria-label="إغلاق الفلاتر"><X size={19} /></button>
          </div>
          {fields}
          <button type="button" className="button button-primary category-filter-apply" onClick={onClose} data-testid="button-category-filter-apply">عرض النتائج</button>
        </div>
      </div>
    );
  }
  return <aside className="filter-panel category-filter-panel"><h3>تصفية القسم</h3>{fields}</aside>;
}

function CategoryShoppingSection({
  products,
  isLoading,
  isError,
  retry,
  title,
  empty,
}: {
  products: StoreProduct[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  title: string;
  empty: string;
}) {
  const { formatPrice } = useStore();
  const [sort, setSort] = useState('featured');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockOnly, setStockOnly] = useState(false);
  const [selectedPriceBand, setSelectedPriceBand] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const brands = useMemo(
    () => Array.from(new Map(products.map((product) => [categoryBrandKey(product), product.brand])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'ar')),
    [products],
  );
  const priceBands = useMemo(() => categoryPriceBands(products, formatPrice), [products, formatPrice]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesBrand = !selectedBrands.length || selectedBrands.includes(categoryBrandKey(product));
    const matchesStock = !stockOnly || product.quantity > 0;
    const band = priceBands.find((item) => item.id === selectedPriceBand);
    const price = productPrice(product);
    const matchesPrice = !band || (price >= band.min && (band.id === 'price-high' ? price <= band.max : price <= band.max));
    return matchesBrand && matchesStock && matchesPrice;
  }), [products, selectedBrands, stockOnly, selectedPriceBand, priceBands]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === 'price-low') return productPrice(a) - productPrice(b);
    if (sort === 'price-high') return productPrice(b) - productPrice(a);
    if (sort === 'name') return a.productName.localeCompare(b.productName, 'ar');
    return Number(b.quantity > 0) - Number(a.quantity > 0);
  }), [filtered, sort]);
  const activeFilterCount = selectedBrands.length + Number(stockOnly) + Number(Boolean(selectedPriceBand));
  const clearFilters = () => {
    setSelectedBrands([]);
    setStockOnly(false);
    setSelectedPriceBand('');
  };

  return (
    <section className="category-shopping-section">
      <div className="container">
        <div className="category-shopping-heading">
          <div>
            <span className="eyebrow">من الكتالوج الحالي</span>
            <h2>{title}</h2>
            <p>قارن المنتجات المنشورة حسب السعر والتوافر والبيانات الظاهرة قبل فتح صفحة المنتج.</p>
          </div>
          <span className="category-shopping-note"><ShieldCheck size={15} /> السعر والتوافر من الكتالوج الحالي</span>
        </div>
        {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={retry} /> : (
          <div className="category-shopping-layout">
            <CategoryFilterPanel
              brands={brands}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              stockOnly={stockOnly}
              setStockOnly={setStockOnly}
              priceBands={priceBands}
              selectedPriceBand={selectedPriceBand}
              setSelectedPriceBand={setSelectedPriceBand}
            />
            <main>
              <div className="category-mobile-toolbar">
                <button type="button" className="category-filter-toggle" onClick={() => setMobileFiltersOpen(true)} aria-expanded={mobileFiltersOpen} data-testid="button-category-filters">
                  <SlidersHorizontal size={16} /> الفلاتر {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
                </button>
                {activeFilterCount > 0 && <button type="button" className="category-clear-mobile" onClick={clearFilters} data-testid="button-category-clear-mobile">مسح الكل</button>}
              </div>
              <CatalogToolbar products={sorted} sort={sort} setSort={setSort} />
              {activeFilterCount > 0 && (
                <div className="category-active-filters" aria-label="الفلاتر النشطة">
                  {selectedBrands.map((brandSlug) => <button type="button" key={brandSlug} onClick={() => setSelectedBrands(selectedBrands.filter((item) => item !== brandSlug))}>{brands.find(([slug]) => slug === brandSlug)?.[1] || brandSlug} <X size={12} /></button>)}
                  {stockOnly && <button type="button" onClick={() => setStockOnly(false)}>المتاح فقط <X size={12} /></button>}
                  {selectedPriceBand && <button type="button" onClick={() => setSelectedPriceBand('')}>{priceBands.find((band) => band.id === selectedPriceBand)?.label} <X size={12} /></button>}
                  <button type="button" className="category-clear-filters" onClick={clearFilters} data-testid="button-category-clear-filters">مسح الكل</button>
                </div>
              )}
              <ProductGrid products={sorted} empty={empty} />
            </main>
          </div>
        )}
      </div>
      {mobileFiltersOpen && !isLoading && !isError && (
        <CategoryFilterPanel
          mobile
          onClose={() => setMobileFiltersOpen(false)}
          brands={brands}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          stockOnly={stockOnly}
          setStockOnly={setStockOnly}
          priceBands={priceBands}
          selectedPriceBand={selectedPriceBand}
          setSelectedPriceBand={setSelectedPriceBand}
        />
      )}
    </section>
  );
}

function CategoryBrandShortcuts({ brands, categorySlug }: { brands: Array<[string, string]>; categorySlug: string }) {
  if (!brands.length) return null;
  return (
    <section className="category-brand-shortcuts">
      <div className="container">
        <div className="category-brand-shortcuts-heading">
          <div><span className="eyebrow">من العلامات المتاحة</span><h2>اختر علامة للمقارنة</h2></div>
          <span>روابط من المنتجات المنشورة في هذا القسم</span>
        </div>
        <div className="category-brand-shortcuts-list">
          {brands.map(([brandSlug, brandName]) => <Link href={brandCategoryPath(brandSlug, categorySlug)} className="category-brand-shortcut" key={brandSlug}><span>{brandName}</span><ArrowLeft size={15} /></Link>)}
        </div>
      </div>
    </section>
  );
}

function BrandCategoryPageView({ brandSlug, categorySlug }: { brandSlug: string; categorySlug: string }) {
  const { catalog, isLoading, isError } = useStore();
  const products = catalog?.products || [];
  const brandProducts = products.filter((product) => product.brandSlug === brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-') === brandSlug);
  const filtered = useMemo(() => brandProducts.filter((product) => matchesCategory(product, categorySlug)), [brandProducts, categorySlug]);
  const brandName = brandProducts[0]?.brand || brandSlug.replaceAll('-', ' ');
  const categoryName = filtered[0]?.category?.name || brandProducts.find((product) => matchesCategory(product, categorySlug))?.category?.name || categorySlug.replaceAll('-', ' ');
  const guideKey = guideKeyForCategory(categorySlug);
  const copy = categoryGuideCopy[guideKey] || {
    eyebrow: 'اختيار داخل العلامة',
    title: `${categoryName} من ${brandName}`,
    description: `تصفح منتجات ${categoryName} من ${brandName} المتاحة حالياً في كتالوج CABL، مع مقارنة البيانات والسعر والتوافر.`,
    selection: `ابدأ من استخدامك، ثم طابق مواصفات ${categoryName} مع جهازك قبل اختيار موديل من ${brandName}.`,
    tips: ['راجع رقم الموديل والبيانات المنشورة قبل الدفع.', 'طابق المنافذ والقدرة والتوافق مع جهازك.', 'قارن السعر والتوافر الحاليين بين المنتجات.', 'راجع الشحن والدفع في checkout قبل تأكيد الطلب.', 'احتفظ برقم الطلب وشروط الإرجاع بعد الشراء.'],
    faqs: [
      { question: `كيف أختار ${categoryName} من ${brandName}؟`, answer: 'ابدأ من الاستخدام، ثم قارن المواصفات والتوافق والسعر والتوافر في صفحات المنتجات.' },
      { question: 'هل كل المنتجات متوفرة؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح ويعاد التحقق عند الإضافة والطلب.' },
      { question: 'أين أجد الشحن والإرجاع؟', answer: 'راجع الخيارات النشطة في checkout وسياسة الإرجاع قبل تأكيد الطلب.' },
    ],
  };
  const categoryPathSlug = filtered[0]?.category?.slug
    || brandProducts.find((product) => matchesCategory(product, categorySlug))?.category?.slug
    || categorySlug;
  const description = `${categoryName} من ${brandName} في اليمن. قارن المواصفات والسعر والتوافر قبل الطلب من CABL.`;
  const canonicalPath = brandCategoryPath(brandSlug, categorySlug);
  const brandCategoryJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${categoryName} من ${brandName}`,
        description,
        url: canonicalPath,
      },
      {
        '@type': 'Brand',
        name: brandName,
        url: brandPath(brandSlug),
      },
      {
        '@type': 'ItemList',
        name: `منتجات ${categoryName} من ${brandName}`,
        numberOfItems: filtered.length,
        itemListElement: filtered.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: productPath(product),
          name: product.productName,
        })),
      },
    ],
  }), [brandSlug, brandName, canonicalPath, categoryName, description, filtered]);

  return (
    <>
      <StaticSEO title={`${categoryName} ${brandName}`} description={description} canonicalPath={canonicalPath} jsonLd={brandCategoryJsonLd} />
      <div className="category-landing-hero brand-category-hero">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'العلامات', href: `/brand/${brandSlug}` },
            { label: brandName, href: `/brand/${brandSlug}` },
            { label: categoryName },
          ]} />
          <div className="category-landing-hero-grid">
            <div className="category-landing-copy">
              <span className="eyebrow">{copy.eyebrow}</span>
              <h1>{categoryName} <em>{brandName}</em></h1>
              <p>{copy.description}</p>
              <div className="category-landing-actions">
                <Link className="button button-secondary" href={brandPath(brandSlug)}>كل منتجات {brandName}</Link>
                <Link className="button button-secondary" href={`/category/${categoryPathSlug}`}>كل {categoryName}</Link>
                <Link className="button button-primary" href="/search">كل المنتجات <ArrowLeft size={16} /></Link>
              </div>
            </div>
            <div className="category-hero-rail" aria-label="ملخص العلامة والقسم">
              <div><span>منتجات القسم</span><strong>{filtered.length}</strong><small>من {brandName}</small></div>
              <div><span>متاح الآن</span><strong>{filtered.filter((product) => product.quantity > 0).length}</strong><small>توافر الكتالوج</small></div>
            </div>
          </div>
        </div>
      </div>
      <CategoryShoppingSection
        products={filtered}
        isLoading={isLoading}
        isError={isError}
        retry={() => window.location.reload()}
        title={`${categoryName} من ${brandName}`}
        empty={`لا توجد منتجات منشورة من ${brandName} في قسم ${categoryName} حالياً.`}
      />
      <EditorialSection eyebrow="بيانات قابلة للمراجعة" title={`كيف تختار ${categoryName} من ${brandName}؟`}>
        <div className="editorial-copy"><p>{copy.selection}</p></div>
        <div className="numbered-steps category-tip-grid">{copy.tips.map((tip, index) => <div key={tip}><b>{String(index + 1).padStart(2, '0')}</b><p>{tip}</p></div>)}</div>
      </EditorialSection>
      <EditorialSection title="قبل تأكيد الطلب">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'بيانات الموديل', text: 'راجع اسم الموديل ورقم SKU والمنافذ والقدرة في صفحة المنتج.' },
          { icon: <Zap />, title: 'التوافق', text: 'طابق المنتج مع الجهاز والكابل والاستخدام، ولا تعتمد على الاسم أو الصورة فقط.' },
          { icon: <Truck />, title: 'الشحن', text: 'اختر المدينة والعنوان في checkout لرؤية خيارات الشحن النشطة.' },
          { icon: <RefreshCcw />, title: 'الإرجاع', text: 'راجع شروط الإرجاع والاستبدال واحتفظ برقم الطلب وإثبات الشراء.' },
        ]} />
      </EditorialSection>
      <EditorialSection title={`أسئلة شائعة عن ${categoryName} ${brandName}`}>
        <FAQList items={mergeFaqItems(copy.faqs, keywordClusterForCategory(categorySlug)?.faqs.slice(0, 2) || [])} />
      </EditorialSection>
      <EditorialSection title="روابط مرتبطة">
        <div className="category-related-links">
          <Link href={brandPath(brandSlug)}><ArrowRight /><strong>كل منتجات {brandName}</strong><span>تصفح جميع الأقسام المتاحة من هذه العلامة.</span><ArrowLeft size={15} /></Link>
          <Link href={`/category/${categoryPathSlug}`}><Zap /><strong>كل {categoryName}</strong><span>قارن منتجات القسم من العلامات المتاحة.</span><ArrowLeft size={15} /></Link>
          <Link href="/shipping"><Truck /><strong>الشحن والتوصيل</strong><span>راجع الرسوم والمدة حسب العنوان.</span><ArrowLeft size={15} /></Link>
          <Link href="/return-policy"><RefreshCcw /><strong>الإرجاع والاستبدال</strong><span>اعرف الشروط والخطوات قبل الطلب.</span><ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

const categoryGuideCopy: Record<string, {
  eyebrow: string;
  title: string;
  description: string;
  selection: string;
  tips: string[];
  faqs: Array<{ question: string; answer: string }>;
}> = {
  'power-banks': {
    eyebrow: 'اختيار الطاقة الاحتياطية',
    title: 'خوازن طاقة تناسب يومك',
    description: 'قارن السعة والطاقة والقدرة والمنافذ والوزن والسعر الحالي قبل اختيار خازن طاقة (Power Bank) داخل اليمن.',
    selection: 'ابدأ من الجهاز ومدة الاستخدام، ثم راجع Wh والخرج والتوافق. mAh وحدها لا تحدد عدد الشحنات ولا إمكانية شحن اللابتوب.',
    tips: ['للاستخدام اليومي: راجع فئة 10,000mAh والحجم والوزن وعدد المنافذ.', 'للسفر وانقطاع الكهرباء: قارن 20,000mAh بعد مراجعة Wh والوزن وقواعد السفر.', 'للابتوب: طابق خرج USB-C PD الفعلي مع متطلبات جهازك والكابل.', 'لا تترك البطارية في الشمس أو السيارة الحارة، ولا تعتبر عدد الشحنات وعداً ثابتاً.', 'راجع رقم الموديل والبيانات المطبوعة قبل الدفع.'],
    faqs: [
      { question: 'هل أختار 10,000 أم 20,000mAh؟', answer: 'اختر حسب مدة الاستخدام والوزن وقدرة الخرج. السعة الأعلى ليست أفضل إن كانت ستبقى في المنزل بسبب حجمها.' },
      { question: 'هل كل باور بانك يشحن اللابتوب؟', answer: 'لا. يجب أن يذكر USB-C PD بقدرة مناسبة، مع كابل يدعم القدرة المطلوبة.' },
      { question: 'هل mAh وحدها تكفي للمقارنة؟', answer: 'لا. راجع Wh والقدرة والمنافذ والوزن والتوافق مع جهازك.' },
    ],
  },
  chargers: {
    eyebrow: 'اختيار الشاحن',
    title: 'شاحن مناسب لجهازك',
    description: 'قارن قدرة الشاحن والمنافذ والبروتوكولات والحجم قبل شراء شاحن حائط أو شاحن سريع.',
    selection: 'الشاحن المناسب ليس صاحب الرقم الأكبر. طابق القدرة والبروتوكول مع الجهاز، ثم تأكد من أن الكابل يدعم نفس المسار.',
    tips: ['حدد USB-C أو USB-A وعدد المنافذ التي تحتاجها.', 'راجع USB-C PD أو PPS أو QC كما هو مذكور في صفحة الموديل.', 'القدرة الإجمالية قد تختلف عن قدرة منفذ واحد عند شحن أكثر من جهاز.', 'استخدم كابلاً مصنفاً للقدرة المطلوبة ولا تعتمد على شكل المنفذ وحده.', 'اترك مساحة للحرارة والتهوية ولا تغطِّ الشاحن أثناء الاستخدام.'],
    faqs: [
      { question: 'هل الشاحن الأعلى واطاً يشحن كل الأجهزة بسرعة أكبر؟', answer: 'لا. الجهاز والكابل والبروتوكول والحرارة تحدد القدرة الفعلية.' },
      { question: 'هل USB-C يعني PD؟', answer: 'لا. USB-C شكل منفذ، أما PD فهو بروتوكول شحن يجب أن يذكره المنتج.' },
      { question: 'هل يمكن شحن جهازين معاً؟', answer: 'نعم إذا كان الموديل يدعم ذلك، لكن راجع توزيع القدرة عند استخدام أكثر من منفذ.' },
    ],
  },
  cables: {
    eyebrow: 'اختيار الكابل',
    title: 'توصيلة شحن لا تحد جهازك',
    description: 'قارن نوع المنفذ والطول وتصنيف القدرة ونقل البيانات قبل إضافة توصيلة (Charging Cable) إلى السلة.',
    selection: 'التوصيلة جزء من سرعة الشحن والتوافق. طابق طرفيها مع الشاحن والجهاز، ثم راجع القدرة أو سرعة البيانات المعلنة للموديل.',
    tips: ['حدد USB-C إلى USB-C أو USB-A إلى USB-C أو Lightning حسب أجهزتك.', 'راجع القدرة بالواط إذا كنت تستخدم شحناً سريعاً أو لابتوباً.', 'لا تعتبر كل كابلات USB-C متساوية في نقل البيانات أو الفيديو.', 'اختر طولاً يناسب مكان الاستخدام دون شد أو ثني حاد.', 'استبدل الكابل عند تلف الغلاف أو ارتفاع الحرارة أو انقطاع الاتصال.'],
    faqs: [
      { question: 'هل كل كابل USB-C يدعم الشحن السريع؟', answer: 'لا. القدرة والتصنيف يختلفان بين الكابلات، ويجب مراجعة بيانات الموديل.' },
      { question: 'هل طول الكابل يؤثر؟', answer: 'قد يؤثر على الراحة والفقد في بعض الاستخدامات؛ الأهم أن يكون الكابل مصنفاً للقدرة المطلوبة.' },
      { question: 'هل الكابل يحدد سرعة البيانات؟', answer: 'نعم. بعض كابلات الشحن لا تدعم نفس سرعات البيانات أو الفيديو.' },
    ],
  },
  'car-accessories': {
    eyebrow: 'الشحن في السيارة',
    title: 'حل شحن عملي أثناء التنقل',
    description: 'قارن شواحن السيارة والكابلات والحوامل حسب منفذ السيارة وقدرة الهاتف والحرارة أثناء القيادة.',
    selection: 'ابدأ من منفذ السيارة والهاتف والكابل، ثم راجع القدرة والحرارة. الشحن أثناء الملاحة يحتاج حلاً متوازناً لا رقماً تسويقياً فقط.',
    tips: ['طابق USB-C PD أو البروتوكول المطلوب مع هاتفك.', 'استخدم كابلاً مصنفاً للقدرة المطلوبة.', 'ثبت الهاتف والحوامل بعيداً عن الحرارة المباشرة قدر الإمكان.', 'خفض السطوع والحرارة قد يساعدان الهاتف على الحفاظ على سرعة الشحن.', 'أوقف الاستخدام إذا ظهرت حرارة غير طبيعية أو انقطاع متكرر.'],
    faqs: [
      { question: 'لماذا يصبح الشحن بطيئاً في السيارة؟', answer: 'قد يكون السبب القدرة أو الكابل أو تفاوض البروتوكول أو الحرارة أثناء الملاحة.' },
      { question: 'هل USB-A يكفي؟', answer: 'قد يشحن الهاتف، لكنه لا يضمن تفاوض USB-C PD أو السرعة التي يدعمها جهازك.' },
      { question: 'هل الحامل اللاسلكي أفضل؟', answer: 'يعتمد على الهاتف والحرارة وطريقة الاستخدام. راجع التوافق ولا تستخدمه عند ارتفاع الحرارة.' },
    ],
  },
  audio: {
    eyebrow: 'اختيار الصوتيات',
    title: 'صوتيات للاستخدام اليومي',
    description: 'قارن السماعات وسماعات الأذن والسبيكرات حسب الاستخدام والاتصال والحجم والبطارية والراحة.',
    selection: 'حدد المكان أولاً: مكالمات، عمل، سفر، غرفة أو تجمع. بعد ذلك راجع نوع الاتصال والبطارية والحجم والملحقات المتاحة.',
    tips: ['للمكالمات: راجع الميكروفونات وطريقة تثبيت السماعة.', 'للسفر: قارن الوزن والبطارية والحجم والعزل إن كان مذكوراً.', 'للسبيكر: راجع الحجم والقدرة وطريقة الاقتران، ولا تفترض مستوى صوت من رقم واحد.', 'تحقق من توافق الهاتف والأنظمة قبل الطلب.', 'راجع ما إذا كانت الملحقات والشاحن ضمن العبوة أو تباع منفصلة.'],
    faqs: [
      { question: 'هل السماعة الأكبر صوتها أفضل؟', answer: 'ليس بالضرورة. الاستخدام والحجم والاتصال والراحة عوامل مهمة أيضاً.' },
      { question: 'هل كل سماعات البلوتوث تعمل مع كل هاتف؟', answer: 'غالباً تتصل عبر Bluetooth، لكن راجع الإصدار والخصائص والتوافق للموديل المحدد.' },
      { question: 'كيف أختار بين سماعة أذن وسبيكر؟', answer: 'اختر حسب الخصوصية والمكان وعدد المستمعين وطريقة الاستخدام اليومية.' },
    ],
  },
  'wireless-microphones': {
    eyebrow: 'صوت أوضح لصناعة المحتوى',
    title: 'مايكروفونات لاسلكية لصانع المحتوى',
    description: 'قارن ميكروفونات Hollyland اللاسلكية لصناعة المحتوى والمقابلات والبث المباشر حسب الموديل والتكوين والتوافر.',
    selection: 'ابدأ من طريقة التصوير والجهاز الذي ستوصل به المستقبل، ثم راجع التكوين والبيانات المعلنة لكل موديل قبل الطلب. لا تفترض أن كل نسخة من الاسم نفسه تحتوي على نفس المستقبلات أو الملحقات.',
    tips: ['حدد هل ستصور بكاميرا أو هاتف USB-C أو هاتف Lightning قبل اختيار التكوين.', 'راجع الموديل والنسخة الموجودة في صفحة المنتج، خصوصاً عند مقارنة Combo وMobile.', 'ضع الميكروفون قريباً من مصدر الصوت وتحقق من التثبيت قبل بدء التصوير.', 'استخدم إلغاء الضوضاء حسب المكان، ولا تعتمد عليه بديلاً عن اختيار موقع هادئ.', 'راجع التوافر والشحن والملحقات الظاهرة في checkout قبل تأكيد الطلب.'],
    faqs: [
      { question: 'كيف أختار ميكروفوناً لاسلكياً لصناعة المحتوى؟', answer: 'ابدأ بالجهاز وطريقة التصوير، ثم قارن التكوين والمدى والبيانات المعلنة للموديل المحدد.' },
      { question: 'هل نسخة Combo تناسب كل الأجهزة؟', answer: 'يعتمد ذلك على المستقبلات والملحقات الموجودة في التكوين. راجع اسم النسخة ومخرجاتها قبل الطلب.' },
      { question: 'هل إلغاء الضوضاء يغني عن المكان الهادئ؟', answer: 'لا. يساعد على تقليل بعض الضوضاء، لكنه لا يلغي أثر المكان أو المسافة أو طريقة التثبيت.' },
    ],
  },
  'wireless-earbuds': {
    eyebrow: 'اختيار الصوت المتنقل',
    title: 'سماعات أذن لاسلكية للاستخدام اليومي',
    description: 'قارن سماعات Soundcore اللاسلكية حسب الموديل والاستخدام والمكالمات والتوافر قبل الطلب.',
    selection: 'ابدأ من طريقة الاستخدام: مكالمات، سفر، استماع يومي أو شحن أثناء التنقل. ثم راجع الموديل والتكوين والبيانات المعلنة من المصدر الرسمي.',
    tips: ['حدد هل تحتاج سماعة للمكالمات أو للاستماع اليومي أو للسفر.', 'راجع اسم الموديل والنسخة قبل المقارنة، خصوصاً بين R50i وR50i NC.', 'راجع ما إذا كانت علبة الشحن تحتوي على وظيفة إضافية أو ملحقات مدمجة كما يذكر المصدر.', 'طابق الهاتف مع طريقة الاتصال والتطبيق والخصائص المنشورة للموديل.', 'راجع التوافر والشحن والملحقات الظاهرة في checkout قبل تأكيد الطلب.'],
    faqs: [
      { question: 'كيف أختار سماعة أذن لاسلكية؟', answer: 'ابدأ بالاستخدام والراحة والمكالمات والبطارية، ثم قارن الموديل المحدد والبيانات المنشورة له.' },
      { question: 'ما الفرق بين R50i وR50i NC؟', answer: 'هما موديلان مختلفان في الكتالوج؛ راجع صفحة كل منتج والخصائص المنشورة من المصدر قبل المقارنة.' },
      { question: 'هل كل سماعات الأذن مناسبة للمكالمات؟', answer: 'يمكن استخدامها للمكالمات، لكن جودة الميكروفونات والاتصال تختلف حسب الموديل والبيئة.' },
    ],
  },
};

function CategoryLandingPage({ slug }: { slug: string }) {
  const { catalog, isLoading, isError } = useStore();
  const products = catalog?.products || [];
  const seoParams = { type: 'category' as const, slug };
  const { data: categorySeo, isLoading: isSeoLoading, isError: isSeoError } = useGetStoreSeo(seoParams, {
    query: { queryKey: getGetStoreSeoQueryKey(seoParams), enabled: Boolean(slug), staleTime: 60_000 },
  });
  const categoryProducts = useMemo(() => products.filter((product) => matchesCategory(product, slug)), [products, slug]);
  const name = categorySeo?.h1 || categoryProducts[0]?.category?.name || slug.replaceAll('-', ' ');
  if (!isLoading && !isSeoLoading && (isError || isSeoError || !categorySeo)) {
    return (
      <>
        <NoIndex />
        <div className="container">
          <Breadcrumbs items={[{ label: 'الأقسام', href: '/search' }, { label: 'القسم غير موجود' }]} />
          <div className="state-panel" style={{ margin: '60px 0' }}>
            <h1>القسم غير موجود</h1>
            <p>هذا القسم غير متاح حالياً في كتالوج CABL.</p>
            <Link href="/search" className="button button-primary">استعرض الكتالوج</Link>
          </div>
        </div>
      </>
    );
  }
  const copy = categoryGuideCopy[slug] || {
    eyebrow: 'دليل القسم',
    title: `منتجات ${name} في اليمن`,
    description: `قارن منتجات ${name} المتاحة حالياً في كتالوج CABL، ثم راجع التوافق والسعر والشحن قبل الطلب.`,
    selection: `ابدأ من استخدامك، ثم قارن الموديل والمواصفات والسعر والتوافر بين منتجات ${name}.`,
    tips: ['حدد الاستخدام الأساسي قبل اختيار المنتج.', 'راجع المنافذ والقدرة والتوافق في صفحة الموديل.', 'قارن السعر والتوافر الحاليين، لا الاسم وحده.', 'راجع خيارات الشحن والدفع قبل تأكيد الطلب.', 'احتفظ برقم الطلب وشروط الإرجاع بعد الشراء.'],
    faqs: [
      { question: 'كيف أختار منتجاً من هذا القسم؟', answer: 'ابدأ من الاستخدام، ثم راجع المواصفات والتوافق والسعر والتوافر في صفحة المنتج.' },
      { question: 'هل كل المنتجات متوفرة؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح ويعاد التحقق عند الإضافة والطلب.' },
      { question: 'أين أجد الشحن والإرجاع؟', answer: 'راجع الخيارات النشطة في checkout وسياسة الإرجاع قبل تأكيد الطلب.' },
    ],
  };
  const description = categorySeo?.description || copy.description;
  const brands = useMemo(
    () => Array.from(new Map(categoryProducts.map((product) => [categoryBrandKey(product), product.brand])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'ar')),
    [categoryProducts],
  );
  const relatedCategories = useMemo(
    () => Array.from(new Map(
      products
        .filter((product) => product.category && !matchesCategory(product, slug))
        .map((product) => [product.category!.slug, product.category!]),
    ).values()).slice(0, 4),
    [products, slug],
  );
  const guideKey = guideKeyForCategory(slug);
  const guideHref = guideKey === 'power-banks' ? '/blog/best-power-bank-yemen' : null;
  return (
    <>
      <SEO type="category" slug={slug} />
      <div className="category-landing-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'الأقسام', href: '/search' }, { label: name }]} />
          <div className="category-landing-hero-grid">
            <div className="category-landing-copy">
              <span className="eyebrow">{copy.eyebrow}</span>
              <h1>{name}</h1>
              <p>{description}</p>
            </div>
            <div className="category-hero-rail" aria-label="ملخص القسم">
              <div><span>منتجات منشورة</span><strong>{categoryProducts.length}</strong><small>من الكتالوج الحالي</small></div>
              <div><span>متاح الآن</span><strong>{categoryProducts.filter((product) => product.quantity > 0).length}</strong><small>قابل للإضافة للسلة</small></div>
            </div>
          </div>
        </div>
      </div>
      <CategoryBrandShortcuts brands={brands} categorySlug={slug} />
      <CategoryShoppingSection
        products={categoryProducts}
        isLoading={isLoading}
        isError={isError}
        retry={() => window.location.reload()}
        title={`${name} المتاحة الآن`}
        empty={`لا توجد منتجات منشورة في قسم ${name} حالياً.`}
      />
      {slug === 'wireless-microphones' && (
        <section className="guided-discovery guided-audio-discovery category-audio-discovery" aria-labelledby="category-creator-audio-title">
          <div className="container guided-discovery-inner">
            <div>
              <span className="eyebrow">اختيار حسب الاستخدام</span>
              <h2 id="category-creator-audio-title">صانع محتوى وتريد صوت احترافي؟</h2>
              <p>افتح صفحة Hollyland وقارن الموديلات المنشورة، ثم راجع التكوين والتوافر قبل إضافة المنتج إلى السلة.</p>
            </div>
            <div className="guided-discovery-links">
              <Link href="/brand/hollyland">
                <Package size={20} />
                <strong>تصفح Hollyland</strong>
                <span>كل منتجات العلامة <ArrowLeft size={13} /></span>
              </Link>
              <Link href="/brand/hollyland/wireless-microphones">
                <Headphones size={20} />
                <strong>مقارنة Hollyland</strong>
                <span>داخل قسم الصوت <ArrowLeft size={13} /></span>
              </Link>
              <Link href="/search?brand=Hollyland&category=wireless-microphones">
                <Scale size={20} />
                <strong>افتح نتائج الفلترة</strong>
                <span>راجع المنتجات الأربعة <ArrowLeft size={13} /></span>
              </Link>
            </div>
          </div>
        </section>
      )}
      <EditorialSection eyebrow="كيف تختار؟" title={`دليل اختيار ${name}`}>
        <div className="editorial-copy"><p>{copy.selection}</p></div>
        <div className="numbered-steps category-tip-grid">{copy.tips.map((tip, index) => <div key={tip}><b>{String(index + 1).padStart(2, '0')}</b><p>{tip}</p></div>)}</div>
      </EditorialSection>
      <EditorialSection title="ماذا تراجع قبل الشراء؟">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'الموديل والبيانات', text: 'راجع اسم الموديل ورقم SKU والمنافذ والقدرة في صفحة المنتج.' },
          { icon: <Zap />, title: 'التوافق', text: 'طابق المنتج مع الجهاز والكابل والاستخدام، ولا تعتمد على الاسم أو الصورة فقط.' },
          { icon: <Truck />, title: 'الشحن', text: 'اختر المدينة والعنوان في checkout لرؤية خيارات الشحن النشطة.' },
          { icon: <RefreshCcw />, title: 'الإرجاع', text: 'راجع شروط الإرجاع والاستبدال واحتفظ برقم الطلب وإثبات الشراء.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="أسئلة شائعة">
        <FAQList items={mergeFaqItems(copy.faqs, keywordClusterForCategory(slug)?.faqs.slice(0, 2) || [])} />
      </EditorialSection>
      <EditorialSection title="روابط مرتبطة">
        <div className="category-related-links">
          {guideHref && <Link href={guideHref}><BookOpenIcon /><strong>دليل الشراء</strong><span>مقارنات عملية قبل اختيار الطاقة والشحن.</span><ArrowLeft size={15} /></Link>}
          {relatedCategories.map((category) => <Link href={`/category/${category.slug}`} key={category.slug}><Package /><strong>{category.name}</strong><span>انتقل إلى قسم مرتبط من الكتالوج.</span><ArrowLeft size={15} /></Link>)}
          <Link href="/shipping"><Truck /><strong>الشحن والتوصيل</strong><span>راجع الرسوم والمدة حسب العنوان.</span><ArrowLeft size={15} /></Link>
          <Link href="/return-policy"><RefreshCcw /><strong>الإرجاع والاستبدال</strong><span>اعرف الشروط والخطوات قبل الطلب.</span><ArrowLeft size={15} /></Link>
          <Link href="/lab"><FlaskConical /><strong>مركز المواصفات</strong><span>افصل بين المواصفة والحساب والقياس.</span><ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  return <CategoryLandingPage slug={slug} />;
}

export function CategoryPageForSlug({ slug }: { slug: string }) {
  return <CategoryLandingPage slug={slug} />;
}
export function BrandPage() { const { slug = '' } = useParams<{ slug: string }>(); return <BrandStorefrontPage slug={slug}/>; }
export function BrandCategoryPage() {
  const { brandSlug = '', categorySlug = '' } = useParams<{ brandSlug: string; categorySlug: string }>();
  return <BrandCategoryPageView brandSlug={brandSlug} categorySlug={categorySlug} />;
}

function SearchFilters({ brands, categories, powerOptions, protocolOptions, brand, category, power, protocol, onBrandChange, onCategoryChange, onPowerChange, onProtocolChange, onClear }: {
  brands: string[];
  categories: Array<{ slug: string; name: string }>;
  powerOptions: number[];
  protocolOptions: string[];
  brand: string;
  category: string;
  power: string;
  protocol: string;
  onBrandChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPowerChange: (value: string) => void;
  onProtocolChange: (value: string) => void;
  onClear: () => void;
}) {
  return <div className="search-filter-content">
    <div className="search-filter-heading">
      <div><span className="eyebrow">تصفية ذكية</span><h3>فلترة الكتالوج</h3></div>
      {(brand || category || power || protocol) && <button type="button" className="filter-clear-button" onClick={onClear} data-testid="button-clear-search-filters">مسح الكل</button>}
    </div>
    {brand || category || power || protocol ? <div className="active-filter-summary"><span>اختياراتك</span><div>{category && <button type="button" onClick={() => onCategoryChange('')} data-testid="button-remove-category-filter">{categories.find((item) => item.slug === category)?.name}<X size={12} /></button>}{brand && <button type="button" onClick={() => onBrandChange('')} data-testid="button-remove-brand-filter">{brand}<X size={12} /></button>}{power && <button type="button" onClick={() => onPowerChange('')} data-testid="button-remove-power-filter">+{power}W<X size={12} /></button>}{protocol && <button type="button" onClick={() => onProtocolChange('')} data-testid="button-remove-protocol-filter">{protocol}<X size={12} /></button>}</div></div> : <p className="filter-help">ابدأ بالقسم الأقرب لاحتياجك، ثم اختر العلامة التي تفضلها.</p>}
    <div className="filter-group filter-group-primary">
      <div className="filter-group-heading"><h4>القسم</h4><span>{categories.length}</span></div>
      <div className="filter-options">{categories.map((item) => <label className={`filter-check ${category === item.slug ? 'is-selected' : ''}`} key={item.slug}><input type="radio" name="search-category" checked={category === item.slug} onChange={() => onCategoryChange(category === item.slug ? '' : item.slug)} data-testid={`input-filter-category-${item.slug}`} /><span className="filter-check-mark" />{item.name}</label>)}</div>
    </div>
    <div className="filter-group">
      <div className="filter-group-heading"><h4>العلامة التجارية</h4><span>{brands.length}</span></div>
      <div className="filter-options">{brands.map((item) => <label className={`filter-check ${brand === item ? 'is-selected' : ''}`} key={item}><input type="radio" name="search-brand" checked={brand === item} onChange={() => onBrandChange(brand === item ? '' : item)} data-testid={`input-filter-brand-${item}`} /><span className="filter-check-mark" />{item}</label>)}</div>
    </div>
    {powerOptions.length > 0 && <div className="filter-group">
      <div className="filter-group-heading"><h4>القدرة القصوى</h4><span>W</span></div>
      <div className="filter-options">{powerOptions.map((item) => <label className={`filter-check ${power === String(item) ? 'is-selected' : ''}`} key={item}><input type="radio" name="search-power" checked={power === String(item)} onChange={() => onPowerChange(power === String(item) ? '' : String(item))} /><span className="filter-check-mark" />{item}W أو أكثر</label>)}</div>
    </div>}
    {protocolOptions.length > 0 && <div className="filter-group">
      <div className="filter-group-heading"><h4>بروتوكول الشحن</h4><span>{protocolOptions.length}</span></div>
      <div className="filter-options">{protocolOptions.map((item) => <label className={`filter-check ${protocol === item ? 'is-selected' : ''}`} key={item}><input type="radio" name="search-protocol" checked={protocol === item} onChange={() => onProtocolChange(protocol === item ? '' : item)} /><span className="filter-check-mark" />{item}</label>)}</div>
    </div>}
  </div>;
}

export function SearchPage() {
  const { catalog, isLoading, isError, favorites } = useStore();
  const [location, setLocation] = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const view = query.get('view') || 'products';
  const [term, setTerm] = useState(query.get('q') || '');
  const [brand, setBrand] = useState(query.get('brand') || '');
  const [category, setCategory] = useState(query.get('category') || '');
  const [power, setPower] = useState(query.get('power') || '');
  const [protocol, setProtocol] = useState(query.get('protocol') || '');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [sort, setSort] = useState('featured');
  const products = catalog?.products || [];
  const brands = (catalog?.brands || []).map((brand) => brand.name);
  const categories = catalog?.categories || [];
  const powerOptions = Array.from(new Set(products.map((product) => product.specifications.maxPowerW).filter((value): value is number => typeof value === 'number' && value > 0))).sort((a, b) => a - b);
  const protocolOptions = Array.from(new Set(products.flatMap((product) => product.specifications.protocols.map((item) => item.name)))).sort((a, b) => a.localeCompare(b, 'ar'));
  const result = useMemo(() => [...products.filter((product) => (!term || `${product.productName} ${product.brand} ${product.shortDescription || ''}`.toLowerCase().includes(term.toLowerCase())) && (!brand || product.brand === brand) && (!category || product.category?.slug === category) && (!power || (product.specifications.maxPowerW ?? 0) >= Number(power)) && (!protocol || product.specifications.protocols.some((item) => item.name === protocol)))].sort((a, b) => sort === 'price-low' ? (a.discountPrice ?? a.regularPrice) - (b.discountPrice ?? b.regularPrice) : sort === 'price-high' ? (b.discountPrice ?? b.regularPrice) - (a.discountPrice ?? a.regularPrice) : 0), [products, term, brand, category, power, protocol, sort]);
  const favoriteProducts = useMemo(() => products.filter((product) => favorites.includes(product.id)), [products, favorites]);
  const brandDirectory = useMemo(
    () => (catalog?.brands || [])
      .map((brand) => [brand.slug, brand.name, brand.productCount] as const)
      .sort((a, b) => a[1].localeCompare(b[1], 'ar')),
    [catalog],
  );
  const activeFilterCount = Number(Boolean(brand)) + Number(Boolean(category)) + Number(Boolean(power)) + Number(Boolean(protocol));
  const clearFilters = () => { setBrand(''); setCategory(''); setPower(''); setProtocol(''); };
  const toggleCompare = (productId: string) => setCompareIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : current.length >= 4 ? current : [...current, productId]);
  const submit = (event: FormEvent) => { event.preventDefault(); setLocation(`/search${term ? `?q=${encodeURIComponent(term)}` : ''}`); };
   if (view === 'brands') return <><NoIndex/><div className="container"><Breadcrumbs items={[{ label: 'العلامات التجارية' }]}/><PageHeading eyebrow="دليل العلامات" title="اختر علامتك المفضلة" description="تصفح المنتجات المنشورة حسب العلامة التجارية."/>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <div className="brand-directory">{brandDirectory.map(([slug, name, productCount]) => <Link href={`/brand/${slug}`} className="brand-directory-card" key={slug} data-testid={`link-brand-directory-${slug}`}><span className="brand-directory-mark">{name.slice(0, 1)}</span><span><strong>{name}</strong><small>{productCount} منتجات</small></span><ArrowLeft size={17}/></Link>)}</div>}</div></>;
   if (view === 'favorites') return <><NoIndex/><div className="container"><Breadcrumbs items={[{ label: 'المفضلة' }]}/><PageHeading eyebrow="اختياراتك" title="منتجاتك المفضلة" description="المنتجات التي حفظتها على هذا الجهاز تظهر هنا."/>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <ProductGrid products={favoriteProducts} empty="لم تحفظ أي منتج بعد."/>}</div></>;
     return <><NoIndex/><div className="container search-page"><Breadcrumbs items={[{ label: 'البحث' }]}/><div className="search-hero"><div className="search-hero-copy"><span className="eyebrow">اكتشف بهدوء</span><h1>ابحث عن قطعتك القادمة</h1><p>النتائج تتحدث من كتالوج CABL مباشرة.</p></div><form className="big-search" onSubmit={submit}><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="مثلاً: شاحن سريع" aria-label="بحث المنتجات" data-testid="input-search"/><button aria-label="تنفيذ البحث" data-testid="button-submit-search"><SearchIcon size={18}/><span>بحث</span></button></form></div><div className="search-mobile-toolbar"><button type="button" className="search-filter-toggle" onClick={() => setFiltersOpen(true)} data-testid="button-open-search-filters"><SlidersHorizontal size={16}/><span>الفلاتر</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button><span>{result.length} منتج</span></div><div className="search-layout"><aside className="filter-panel"><SearchFilters brands={brands} categories={categories} powerOptions={powerOptions} protocolOptions={protocolOptions} brand={brand} category={category} power={power} protocol={protocol} onBrandChange={setBrand} onCategoryChange={setCategory} onPowerChange={setPower} onProtocolChange={setProtocol} onClear={clearFilters}/></aside><div className="search-results">{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <><CatalogToolbar products={result} sort={sort} setSort={setSort}/>{compareIds.length > 0 && <div className="compare-tray"><div><strong>مقارنة المنتجات</strong><span>{compareIds.length} من 4 منتجات محددة</span></div><div className="compare-tray-actions"><button type="button" className="button button-quiet" onClick={() => setCompareIds([])}>مسح</button>{compareIds.length >= 2 && <Link className="button button-primary" href={`/compare?ids=${compareIds.join(',')}`}><Scale size={15}/> افتح المقارنة</Link>}</div></div>}<ProductGrid products={result} compareIds={compareIds} onToggleCompare={toggleCompare} empty="لم نجد نتائج بهذا الوصف."/></>}</div></div>{filtersOpen && <div className="search-filter-modal" role="dialog" aria-modal="true" aria-label="فلاتر البحث"><button className="search-filter-backdrop" type="button" aria-label="إغلاق الفلاتر" onClick={() => setFiltersOpen(false)} /><aside className="search-filter-drawer"><div className="search-filter-drawer-head"><div><span className="eyebrow">تحكم بالنتائج</span><h2>فلترة المنتجات</h2></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="إغلاق الفلاتر"><X size={19}/></button></div><SearchFilters brands={brands} categories={categories} powerOptions={powerOptions} protocolOptions={protocolOptions} brand={brand} category={category} power={power} protocol={protocol} onBrandChange={setBrand} onCategoryChange={setCategory} onPowerChange={setPower} onProtocolChange={setProtocol} onClear={clearFilters}/><button type="button" className="button button-primary search-filter-apply" onClick={() => setFiltersOpen(false)}>عرض النتائج <ArrowLeft size={15}/></button></aside></div>}</div></>;
}

function ProductDetailPage({ slug }: { slug: string }) {
  const { catalog, isLoading, isError, formatPrice, addToCart } = useStore();
  const product = catalog?.products.find((item) => item.slug === slug);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  if (isLoading) return <div className="container"><Breadcrumbs items={[{ label: 'المنتج' }]}/><LoadingCatalog/></div>;
  if (isError) return <div className="container"><CatalogError retry={() => window.location.reload()}/></div>;
  if (!product) return <div className="container"><div className="state-panel" style={{ margin: '60px 0' }}><h3>هذا المنتج غير متاح</h3><Link href="/search" className="button button-primary" data-testid="link-product-missing">العودة للكتالوج</Link></div></div>;
  const price = product.discountPrice ?? product.regularPrice;
  return (
    <>
      <SEO type="product" slug={slug}/>
      <div className="container product-detail">
        <Breadcrumbs items={[
          ...(product.brandSlug ? [{ label: product.brand, href: brandPath(product.brandSlug) }] : []),
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { label: product.productName },
        ]}/>
        <div className="product-context-strip" data-testid="section-product-context">
          <div className="product-context-main">
            <span className="eyebrow">بيانات المنتج من الكتالوج</span>
            <strong>{product.brand}{product.category ? ` · ${product.category.name}` : ''}</strong>
          </div>
          <div className="product-context-item"><span>SKU</span><b dir="ltr">{product.sku}</b></div>
          <div className="product-context-item"><span>السعر الحالي</span><b>{formatPrice(price)}</b></div>
          <div className={`product-context-item ${product.quantity > 0 ? 'is-available' : 'is-unavailable'}`}><span>التوافر</span><b>{product.quantity > 0 ? `${product.quantity} قطعة` : 'غير متوفر'}</b></div>
        </div>
        <div className="product-detail-grid">
          <div className="detail-gallery">
            <div className="detail-main-image"><img src={product.images?.[imageIndex] || product.images?.[0]} alt={product.productName} data-testid="img-product-main"/></div>
            <div className="thumb-row">{product.images.map((image, index) => <button className={`thumb ${imageIndex === index ? 'active' : ''}`} key={image} onClick={() => setImageIndex(index)} data-testid={`button-product-thumb-${index}`}><img src={image} alt=""/></button>)}</div>
          </div>
          <div className="detail-info">
            <span className="product-brand">{product.brand}</span>
            <h1>{product.productName}</h1>
            <div className="product-identity"><span>SKU</span><b dir="ltr">{product.sku}</b></div>
            <p className="detail-copy">{product.shortDescription || product.productDescription || 'منتج متاح من كتالوج CABL.'}</p>
            <div className="detail-price"><strong data-testid="text-product-detail-price">{formatPrice(price)}</strong>{product.discountPrice && <del>{formatPrice(product.regularPrice)}</del>}</div>
            <div className="stock-note"><i/>{product.quantity > 0 ? `متوفر الآن — ${product.quantity} قطعة` : 'غير متوفر حالياً'}</div>
            <div className="detail-actions">
              <QuantityControl value={quantity} onChange={(value) => setQuantity(Math.max(1, Math.min(product.quantity || 1, value)))} testId="quantity-detail"/>
              <button className="button button-primary" onClick={() => addToCart(product.id, quantity)} disabled={product.quantity < 1} data-testid="button-detail-add-cart">أضف إلى السلة <Package size={17}/></button>
            </div>
            <div className="detail-trust" aria-label="ليش تشتري من CABL؟">
              <div className="detail-trust-heading"><span className="eyebrow">ليش CABL؟</span><strong>اختَر وأنت مطمّن</strong></div>
              <div className="detail-trust-grid">
                {[
                  { number: '01', title: 'نساعدك تختار', text: 'نساعدك بخبرة تختار المنتج اللي يناسب جهازك بالضبط.' },
                  { number: '02', title: 'منتجات أصلية فقط', text: 'منتجات فاخرة من براندات عالمية معروفة.' },
                  { number: '03', title: 'نوصل لباب بيتك', text: 'نوصل لجميع المحافظات اليمنية.' },
                  { number: '04', title: 'معك حتى بعد الشراء', text: 'ضمان، خدمة ما بعد البيع، وإمكانية الإرجاع والاستبدال.' },
                ].map(({ number, title, text }) => (
                  <div className="detail-trust-item" key={number}>
                    <span className="detail-trust-number">{number}</span>
                    <div><strong>{title}</strong><small>{text}</small></div>
                  </div>
                ))}
              </div>
            </div>
            {product.productNote && <div className="detail-note">{product.productNote}</div>}
          </div>
        </div>
        <ProductSpecificationsPanel product={product} />
        <div className="detail-mobile-purchase">
          <div><strong>{formatPrice(price)}</strong><span>{product.quantity > 0 ? 'متوفر الآن' : 'غير متوفر'}</span></div>
          <button className="button button-primary" onClick={() => addToCart(product.id, quantity)} disabled={product.quantity < 1} data-testid="button-mobile-detail-add-cart">أضف إلى السلة <Package size={17}/></button>
        </div>
        <ProductEditorial product={product}/>
      </div>
    </>
  );
}

type StoreProductSpecifications = StoreProduct["specifications"];

const specificationSeoLabels: Record<string, string> = {
  use_case: 'نوع الاستخدام (Use Case)',
  port_type: 'نوع المنفذ (Port Type)',
  max_power_w: 'القدرة القصوى (Max Power)',
  gan: 'تقنية نيتريد الغاليوم (GaN Charging Technology)',
  capacity_mah: 'السعة (Capacity)',
  energy_wh: 'الطاقة (Energy)',
  input_summary: 'مواصفات الإدخال (Input Specifications)',
  output_summary: 'مواصفات الإخراج (Output Specifications)',
  max_output_w: 'أقصى قدرة إخراج (Max Output Power)',
  recharge_time_hours: 'وقت إعادة الشحن (Recharge Time)',
  wireless_charging: 'الشحن اللاسلكي (Wireless Charging)',
  display: 'شاشة العرض (Display)',
  pass_through_charging: 'الشحن أثناء الاستخدام (Pass-through Charging)',
  connector_a: 'الموصل الأول (Connector A)',
  connector_b: 'الموصل الثاني (Connector B)',
  length_m: 'طول الكابل (Cable Length)',
  data_speed_gbps: 'نقل البيانات وسرعتها (Data Transfer Speed)',
  usb_version: 'إصدار USB (USB Version)',
  e_marker: 'شريحة E-marker (E-marker Chip)',
  video_support: 'دعم الفيديو (Video Support)',
  material: 'الخامة (Material)',
  input_voltage_v: 'جهد الإدخال (Input Voltage)',
  power_distribution: 'توزيع الطاقة (Power Distribution)',
  car_compatibility: 'توافق السيارة (Car Compatibility)',
  warranty_months: 'الضمان (Warranty)',
  dimensions: 'الأبعاد (Dimensions)',
  compatibility: 'التوافق (Compatibility)',
};

function specificationLabel(slug: string, fallback: string) {
  return specificationSeoLabels[slug] ?? fallback;
}

function formatSpecificationValue(specs: StoreProductSpecifications, slug: string, unit?: string | null) {
  const attribute = specs.attributes.find((item) => item.slug === slug);
  let value: string | number | boolean | null | undefined = attribute?.values.length
    ? attribute.values.join('، ')
    : attribute?.value;
  if (slug === 'warranty_months') value = specs.warrantyMonths;
  if (slug === 'dimensions') {
    const dimensions = specs.dimensions;
    value = dimensions && [dimensions.lengthMm, dimensions.widthMm, dimensions.heightMm].some((item) => item !== null)
      ? `${dimensions.lengthMm ?? '—'} × ${dimensions.widthMm ?? '—'} × ${dimensions.heightMm ?? '—'}`
      : null;
  }
  if (slug === 'compatibility') value = specs.compatibility.length ? specs.compatibility.map((item) => item.name).join('، ') : null;
  if (slug === 'capacity_mah') value = specs.powerBank?.capacityMah;
  if (slug === 'energy_wh') value = specs.powerBank?.energyWh;
  if (slug === 'input_summary') value = specs.powerBank?.inputSummary;
  if (slug === 'output_summary') value = specs.powerBank?.outputSummary;
  if (slug === 'max_output_w') value = specs.powerBank?.maxOutputW ?? specs.carCharger?.maxOutputW;
  if (slug === 'recharge_time_hours') value = specs.powerBank?.rechargeTimeHours;
  if (slug === 'wireless_charging') value = specs.powerBank?.wirelessCharging;
  if (slug === 'display') value = specs.powerBank?.display;
  if (slug === 'pass_through_charging') value = specs.powerBank?.passThroughCharging;
  if (slug === 'connector_a') value = specs.cable?.connectorA;
  if (slug === 'connector_b') value = specs.cable?.connectorB;
  if (slug === 'length_m') value = specs.cable?.lengthM;
  if (slug === 'data_speed_gbps') value = specs.cable?.dataSpeedGbps;
  if (slug === 'usb_version') value = specs.cable?.usbVersion;
  if (slug === 'e_marker') value = specs.cable?.eMarker;
  if (slug === 'video_support') value = specs.cable?.videoSupport;
  if (slug === 'material') value = specs.cable?.material;
  if (slug === 'input_voltage_v') value = specs.carCharger?.inputVoltageV;
  if (slug === 'power_distribution') value = specs.carCharger?.powerDistribution;
  if (slug === 'car_compatibility') value = specs.carCharger?.carCompatibility;
  if (value === null || value === undefined || value === '') return null;
   if (slug === 'data_speed_gbps' && typeof value === 'number') {
     return `نعم — حتى ${value} Gbps`;
   }
   const rendered = typeof value === 'boolean' ? (value ? 'نعم' : 'لا') : String(value);
   return `${rendered}${unit && slug !== 'dimensions' ? ` ${unit}` : ''}`;
}

function ProductSpecificationsPanel({ product }: { product: StoreProduct }) {
  const specs = product.specifications;
  const hasContent = specs.attributes.length > 0 || specs.ports.length > 0 || specs.protocols.length > 0 || specs.powerProfiles.length > 0 || specs.dimensions || specs.protections.length > 0 || specs.compatibility.length > 0 || specs.maxPowerW !== null || specs.warrantyMonths !== null || specs.powerBank || specs.cable || specs.carCharger;
  if (!hasContent) return null;
  const visibleValue = (value: string | number | boolean | null, unit?: string | null) => {
    if (value === null || value === undefined || value === '') return null;
    return `${typeof value === 'boolean' ? (value ? 'نعم' : 'لا') : value}${unit ? ` ${unit}` : ''}`;
  };
   return <section className="product-specs-panel product-attributes-panel" aria-labelledby="product-attributes-title">
     <div className="product-specs-heading product-attributes-heading"><div><span className="eyebrow">بيانات المنتج المنشورة</span><h2 id="product-attributes-title">خصائص المنتج</h2><p>راجع الخصائص المهمة من الكتالوج الحالي في بطاقات واضحة، من دون جدول مزدحم أو استنتاجات غير موثقة.</p></div>{specs.capabilityLabel && <div className="spec-capability"><b>C</b><span>{specs.capabilityLabel}</span></div>}</div>
    <div className="product-specs-grid product-attributes-grid">
       {specs.maxPowerW !== null && <div className="spec-card"><span>{specificationLabel('max_power_w', 'القدرة القصوى')}</span><strong>{specs.maxPowerW} W</strong></div>}
      {specs.attributes.map((attribute) => {
        const values = attribute.values.length ? attribute.values.join('، ') : visibleValue(attribute.value, attribute.unit);
          return values ? <div className="spec-card product-attribute-card" key={attribute.slug}><span>{specificationLabel(attribute.slug, attribute.label)}</span><strong>{values}</strong></div> : null;
      })}
      {specs.fieldDefinitions.filter((definition) => !['max_power_w', 'dimensions', 'compatibility', 'warranty_months'].includes(definition.slug)).map((definition) => {
        const value = formatSpecificationValue(specs, definition.slug, definition.unit);
          return value ? <div className="spec-card product-attribute-card" key={definition.slug}><span>{specificationLabel(definition.slug, definition.label)}</span><strong>{value}</strong></div> : null;
      })}
       {specs.cable && specs.cable.dataSpeedGbps === null && <div className="spec-card product-attribute-card"><span>نقل البيانات (Data Transfer)</span><strong>غير منشور</strong><small>لا نثبت دعم نقل البيانات من نوع الموصل وحده من دون قيمة موثقة.</small></div>}
       {specs.warrantyMonths !== null && <div className="spec-card product-attribute-card"><span>{specificationLabel('warranty_months', 'الضمان')}</span><strong>{specs.warrantyMonths} شهر</strong>{specs.warrantyNote && <small>{specs.warrantyNote}</small>}</div>}
       {specs.dimensions && (specs.dimensions.lengthMm !== null || specs.dimensions.widthMm !== null || specs.dimensions.heightMm !== null || specs.dimensions.weightG !== null) && <div className="spec-card product-attribute-card"><span>{specificationLabel('dimensions', 'الأبعاد')}</span><strong>{[specs.dimensions.lengthMm, specs.dimensions.widthMm, specs.dimensions.heightMm].every((value) => value !== null) ? `${specs.dimensions.lengthMm} × ${specs.dimensions.widthMm} × ${specs.dimensions.heightMm} mm` : [specs.dimensions.lengthMm, specs.dimensions.widthMm, specs.dimensions.heightMm].some((value) => value !== null) ? `${specs.dimensions.lengthMm ?? '—'} × ${specs.dimensions.widthMm ?? '—'} × ${specs.dimensions.heightMm ?? '—'} mm` : null}</strong>{specs.dimensions.weightG !== null && <small>{specs.dimensions.weightG} g</small>}</div>}
       {specs.ports.length > 0 && <div className="spec-card spec-card-wide product-attribute-card"><span>المنافذ (Ports)</span><div className="spec-list">{specs.ports.map((port) => <span key={port.id}><b>{port.name}</b>{port.type}{port.maxPowerW !== null ? ` · ${port.maxPowerW}W` : ''}</span>)}</div></div>}
       {specs.protocols.length > 0 && <div className="spec-card spec-card-wide product-attribute-card"><span>بروتوكولات الشحن (Charging Protocols)</span><div className="spec-list">{specs.protocols.map((protocol) => <span key={`${protocol.slug}-${protocol.portId ?? 'all'}`}>{protocol.name}</span>)}</div></div>}
       {specs.powerProfiles.length > 0 && <div className="spec-card spec-card-wide product-attribute-card"><span>توزيع الطاقة (Power Distribution)</span><div className="spec-list">{specs.powerProfiles.map((profile) => <span key={profile.name}><b>{profile.name}</b>{profile.totalPowerW !== null ? ` · ${profile.totalPowerW}W` : ''}</span>)}</div></div>}
       {specs.protections.length > 0 && <div className="spec-card spec-card-wide product-attribute-card"><span>الحماية (Protection)</span><div className="spec-list">{specs.protections.map((protection) => <span key={protection.slug}>{protection.name}</span>)}</div></div>}
       {specs.compatibility.length > 0 && <div className="spec-card spec-card-wide product-attribute-card"><span>{specificationLabel('compatibility', 'التوافق')}</span><div className="spec-list">{specs.compatibility.map((item) => <span key={item.slug}><b>{item.name}</b>{item.type === 'supported' ? 'متوافق' : item.type === 'partially_supported' ? 'متوافق جزئياً' : 'غير موصى به'}</span>)}</div></div>}
    </div>
  </section>;
}

export function ComparePage() {
  const { catalog, formatPrice } = useStore();
  const query = new URLSearchParams(window.location.search);
  const ids = [...new Set((query.get('ids') || '').split(',').map((id) => id.trim()).filter(Boolean))].slice(0, 4);
  const compareParams = { productIds: ids.join(',') };
  const comparisonQuery = useCompareStoreProducts(compareParams, { query: { enabled: ids.length >= 2, queryKey: getCompareStoreProductsQueryKey(compareParams) } });
  const localProducts = catalog?.products.filter((product) => ids.includes(product.id)) ?? [];
  if (ids.length < 2) return <><NoIndex/><div className="container"><Breadcrumbs items={[{ label: 'مقارنة المنتجات' }]}/><div className="state-panel" style={{ margin: '60px 0' }}><h3>اختر منتجين على الأقل للمقارنة</h3><Link href="/search" className="button button-primary">العودة للكتالوج</Link></div></div></>;
  if (comparisonQuery.isLoading || !catalog) return <div className="container"><Breadcrumbs items={[{ label: 'مقارنة المنتجات' }]}/><LoadingCatalog/></div>;
  if (comparisonQuery.isError) return <div className="container"><CatalogError retry={() => comparisonQuery.refetch()}/></div>;
  const items = comparisonQuery.data?.products ?? localProducts.map((product) => ({ product, comparison: product.specifications }));
  const rows = [
    { label: 'السعر', value: (item: typeof items[number]) => formatPrice(item.product.discountPrice ?? item.product.regularPrice) },
     { label: specificationLabel('max_power_w', 'القدرة القصوى'), value: (item: typeof items[number]) => item.comparison.maxPowerW !== null ? `${item.comparison.maxPowerW} W` : null },
     { label: 'المنافذ (Ports)', value: (item: typeof items[number]) => item.comparison.ports.length ? item.comparison.ports.map((port) => `${port.name}${port.maxPowerW ? ` · ${port.maxPowerW}W` : ''}`).join('، ') : null },
     { label: 'بروتوكولات الشحن (Charging Protocols)', value: (item: typeof items[number]) => item.comparison.protocols.length ? item.comparison.protocols.map((protocol) => protocol.name).join('، ') : null },
     { label: specificationLabel('dimensions', 'الأبعاد'), value: (item: typeof items[number]) => item.comparison.dimensions ? `${item.comparison.dimensions.lengthMm ?? '—'} × ${item.comparison.dimensions.widthMm ?? '—'} × ${item.comparison.dimensions.heightMm ?? '—'} mm` : null },
     { label: specificationLabel('compatibility', 'التوافق'), value: (item: typeof items[number]) => item.comparison.compatibility.length ? item.comparison.compatibility.map((entry) => entry.name).join('، ') : null },
  ];
  const definitions = Array.from(new Map(items.flatMap((item) => item.comparison.fieldDefinitions).map((definition) => [definition.slug, definition])).values())
    .filter((definition) => !['max_power_w', 'dimensions', 'compatibility'].includes(definition.slug));
  rows.push(...definitions.map((definition) => ({
     label: specificationLabel(definition.slug, definition.label),
    value: (item: typeof items[number]) => formatSpecificationValue(item.comparison, definition.slug, definition.unit),
  })));
  return <><NoIndex/><div className="container compare-page"><Breadcrumbs items={[{ label: 'مقارنة المنتجات' }]}/><PageHeading eyebrow="قرار أوضح" title="قارن المنتجات جنباً إلى جنب" description="القيم الظاهرة هنا مأخوذة من نفس بيانات المواصفات المستخدمة في صفحة المنتج والفلاتر."/><div className="compare-products">{items.map((item) => <article className="compare-product-card" key={item.product.id}><ProductImage product={item.product}/><span>{item.product.brand}</span><h2>{item.product.productName}</h2><Link href={productPath(item.product)} className="text-link">فتح المنتج <ArrowLeft size={14}/></Link></article>)}</div><div className="comparison-table-wrap"><table className="comparison-table comparison-spec-table"><thead><tr><th>المواصفة</th>{items.map((item) => <th key={item.product.id}>{item.product.productName}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th>{row.label}</th>{items.map((item) => <td key={item.product.id}>{row.value(item) || <span className="spec-missing">غير منشور</span>}</td>)}</tr>)}</tbody></table></div></div></>;
}

export function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  return <ProductDetailPage slug={slug} />;
}

export function CanonicalProductPage() {
  const { productSlug = '' } = useParams<{ productSlug: string }>();
  return <ProductDetailPage slug={productSlug} />;
}

function PurchaseSteps({ current }: { current: 'cart' | 'checkout' }) {
  return <nav className="purchase-steps" aria-label="خطوات الشراء">
    <Link href="/cart" className={current === 'cart' ? 'is-current' : 'is-done'} aria-current={current === 'cart' ? 'step' : undefined}><b>01</b> السلة</Link>
    <i />
    <Link href="/checkout" className={current === 'checkout' ? 'is-current' : ''} aria-current={current === 'checkout' ? 'step' : undefined}><b>02</b> البيانات والدفع</Link>
    <i />
    <span><b>03</b> تأكيد الطلب</span>
  </nav>;
}

const YEMEN_CITIES = ['صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'حضرموت', 'ذمار', 'المكلا', 'سيئون', 'حجة', 'صعدة', 'شبوة', 'مأرب', 'البيضاء', 'لحج', 'أبين', 'عمران', 'المحويت', 'ريمة', 'الضالع', 'الجوف'];

export function CartPage() {
  const { cartProducts, cartCount, formatPrice } = useStore();
  const subtotal = cartProducts.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.regularPrice) * item.quantity, 0);
  return (
    <>
      <NoIndex />
      <div className="container cart-page">
        <Breadcrumbs items={[{ label: 'السلة' }]} />
        <PurchaseSteps current="cart" />
        <PageHeading title="سلة مشترياتك" description={cartProducts.length ? 'راجع اختياراتك، ثم انتقل إلى بيانات التوصيل والدفع.' : 'السلة هادئة الآن.'} />
        {cartProducts.length ? (
          <div className="cart-layout">
            <section className="cart-panel">
              <div className="purchase-panel-heading">
                <div><span className="eyebrow">الخطوة الأولى</span><h2>راجع اختياراتك</h2></div>
                <span className="cart-count">{cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'}</span>
              </div>
              <div className="cart-lines">{cartProducts.map((item) => <CartLine key={item.product.id} {...item} />)}</div>
              <Link href="/search" className="continue-shopping"><ArrowRight size={15} /> العودة للتسوق</Link>
            </section>
            <aside className="summary-panel cart-summary">
              <div className="summary-kicker"><span>جاهز للطلب؟</span><ShieldCheck size={16} /></div>
              <h2>ملخص السلة</h2>
              <div className="summary-row"><span>المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div>
              <div className="summary-row"><span>الشحن</span><span>يحسب بعد العنوان</span></div>
              <div className="summary-row total"><span>الإجمالي المتوقع</span><b>{formatPrice(subtotal)}</b></div>
              <Link href="/checkout" className="button button-primary" data-testid="link-checkout">متابعة إلى البيانات <ArrowLeft size={16} /></Link>
              <p className="summary-note">سنحسب الشحن ونراجع الكوبون قبل تأكيد الطلب.</p>
            </aside>
          </div>
        ) : (
          <div className="empty-state"><div className="empty-icon"><Package size={28} /></div><h3>لم تضف أي منتج بعد</h3><p>ابدأ من الكتالوج، وستظهر اختياراتك هنا.</p><Link href="/search" className="button button-primary" data-testid="link-cart-empty-search">استعرض المنتجات</Link></div>
        )}
      </div>
    </>
  );
}

export function CheckoutPage() {
  const { catalog, cartProducts, formatPrice } = useStore();
  const [, setLocation] = useLocation();
  const orderMutation = useCreateStoreOrder();
  const [shippingId, setShippingId] = useState<number | undefined>(catalog?.shippingOptions[0]?.id);
  const [paymentId, setPaymentId] = useState<number | undefined>(catalog?.paymentMethods[0]?.id);
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', addressLine1: '', city: 'صنعاء', paymentReference: '', couponCode: '' });
  const [error, setError] = useState('');
  const [couponHint, setCouponHint] = useState('');
  useEffect(() => {
    if (!shippingId && catalog?.shippingOptions[0]) setShippingId(catalog.shippingOptions[0].id);
    if (!paymentId && catalog?.paymentMethods[0]) setPaymentId(catalog.paymentMethods[0].id);
  }, [catalog, shippingId, paymentId]);
  const selectedShipping = catalog?.shippingOptions.find((item) => item.id === shippingId);
  const selectedPayment = catalog?.paymentMethods.find((item) => item.id === paymentId);
  const subtotal = cartProducts.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.regularPrice) * item.quantity, 0);
  const shippingCost = selectedShipping?.free ? 0 : selectedShipping?.charge || 0;
  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const applyCoupon = () => setCouponHint(form.couponCode.trim() ? 'سيتم التحقق من الكود عند تأكيد الطلب.' : 'أدخل كود الخصم أولاً.');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!shippingId || !paymentId || !cartProducts.length) {
      setError('اختر طريقة الشحن والدفع وتأكد من وجود منتج في السلة.');
      return;
    }
    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const payload: StoreOrderInput = {
      customer: { firstName, lastName, email: form.email.trim() || null, phoneNumber: form.phoneNumber },
      address: { addressLine1: form.addressLine1, addressLine2: null, postalCode: null, country: 'اليمن', city: form.city, phoneNumber: form.phoneNumber || null },
      items: cartProducts.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      shippingId,
      paymentMethodId: paymentId,
      paymentReference: form.paymentReference || null,
      couponCode: form.couponCode || null,
    };
    orderMutation.mutate({ data: payload }, {
      onSuccess: (order) => setLocation(`/order/${order.id}?phone=${encodeURIComponent(form.phoneNumber)}`),
      onError: () => setError('لم يتم إرسال الطلب. راجع البيانات وكود الخصم وحاول مرة أخرى.'),
    });
  };
  if (!cartProducts.length) return <><NoIndex /><div className="container checkout-page"><div className="empty-state"><h3>السلة فارغة</h3><Link href="/search" className="button button-primary" data-testid="link-checkout-empty">العودة للتسوق</Link></div></div></>;
  return (
    <>
      <NoIndex />
      <div className="container checkout-page">
        <Breadcrumbs items={[{ label: 'السلة', href: '/cart' }, { label: 'إتمام الشراء' }]} />
        <PurchaseSteps current="checkout" />
        <PageHeading title="البيانات والدفع" description="بيانات أقل، طلب أوضح، ونراجع كل شيء قبل الإرسال." />
        <form className="checkout-layout" onSubmit={submit}>
          <div className="checkout-panel">
            <section className="checkout-section">
              <div className="checkout-section-heading"><span className="step-dot">01</span><div><h2>بياناتك</h2><p>نستخدمها لتأكيد الطلب والتواصل معك.</p></div></div>
              <div className="form-grid"><Field label="الاسم الكامل" value={form.fullName} onChange={update('fullName')} required full /><Field label="رقم الهاتف" type="tel" value={form.phoneNumber} onChange={update('phoneNumber')} required /><Field label="البريد الإلكتروني" type="email" value={form.email} onChange={update('email')} optional /></div>
            </section>
            <section className="checkout-section">
              <div className="checkout-section-heading"><span className="step-dot">02</span><div><h2>عنوان التوصيل</h2><p>أدخل العنوان الذي سيصل إليه الطلب.</p></div></div>
              <div className="form-grid"><Field label="العنوان بالتفصيل" value={form.addressLine1} onChange={update('addressLine1')} required full /><label className="form-field full"><span>المدينة</span><select value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required data-testid="select-city">{YEMEN_CITIES.map((city) => <option value={city} key={city}>{city}</option>)}</select></label></div>
            </section>
            <section className="checkout-section">
              <div className="checkout-section-heading"><span className="step-dot">03</span><div><h2>الشحن والدفع</h2><p>خيارات مختصرة، اختر الأنسب لك.</p></div></div>
              <h3 className="choice-label">طريقة الشحن</h3>
              <div className="method-choice-grid">{catalog?.shippingOptions.map((option) => <label className={`method-choice ${shippingId === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name="shipping" checked={shippingId === option.id} onChange={() => setShippingId(option.id)} data-testid={`input-shipping-${option.id}`} /><span className="method-choice-mark">{shippingId === option.id && <Check size={13} />}</span><span className="method-choice-copy"><strong>{option.name}</strong><small>{option.estimatedDays ? `${option.estimatedDays} أيام تقريباً` : 'تأكيد المدة مع الطلب'}</small></span><b>{option.free ? 'مجاني' : formatPrice(option.charge)}</b></label>)}</div>
              <h3 className="choice-label">طريقة الدفع</h3>
              <div className="payment-select-wrap"><CreditCard size={17} /><select value={paymentId ?? ''} onChange={(event) => setPaymentId(Number(event.target.value))} required data-testid="select-payment-method"><option value="" disabled>اختر طريقة الدفع</option>{catalog?.paymentMethods.map((method) => <option value={method.id} key={method.id}>{method.name}</option>)}</select></div>
              {selectedPayment && <p className="selected-payment-note">{selectedPayment.description || selectedPayment.instructions || 'تفاصيل الدفع تظهر عند تأكيد الطلب.'}</p>}
              {selectedPayment?.requiresTransactionReference && <div className="method-extra"><Field label="مرجع التحويل" value={form.paymentReference} onChange={update('paymentReference')} full /></div>}
            </section>
            {error && <div className="notice" role="alert" data-testid="status-checkout-error">{error}</div>}
          </div>
          <aside className="summary-panel checkout-summary">
            <div className="summary-kicker"><span>الخطوة الأخيرة</span><ShieldCheck size={16} /></div>
            <h2>راجع وأرسل</h2>
            <div className="summary-items">{cartProducts.map((item) => <div className="summary-item" key={item.product.id}><span>{item.product.productName} <b>× {item.quantity}</b></span><strong>{formatPrice((item.product.discountPrice ?? item.product.regularPrice) * item.quantity)}</strong></div>)}</div>
            <div className="coupon-box"><div className="coupon-heading"><Tag size={15} /><strong>لديك كود خصم؟</strong></div><div className="coupon-row"><input value={form.couponCode} onChange={update('couponCode')} placeholder="أدخل الكود" aria-label="كود الخصم" data-testid="input-coupon-code" /><button type="button" onClick={applyCoupon} data-testid="button-apply-coupon">تطبيق</button></div>{couponHint && <small className="coupon-hint">{couponHint}</small>}</div>
            <div className="summary-row"><span>المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div>
            <div className="summary-row"><span>الشحن</span><b>{formatPrice(shippingCost)}</b></div>
            <div className="summary-row total"><span>الإجمالي</span><b>{formatPrice(subtotal + shippingCost)}</b></div>
            <button className="button button-primary checkout-submit" type="submit" disabled={orderMutation.isPending} data-testid="button-submit-order">{orderMutation.isPending ? 'جارٍ إرسال الطلب...' : 'تأكيد وإرسال الطلب'} <ArrowLeft size={16} /></button>
            <p className="summary-note">لن يتم خصم أي مبلغ قبل مراجعة تفاصيل الطلب معك.</p>
          </aside>
        </form>
      </div>
    </>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, optional = false, full = false }: { label: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; optional?: boolean; full?: boolean }) { return <label className={`form-field ${full ? 'full' : ''}`}><span>{label}{optional && <small className="field-optional">اختياري</small>}</span><input type={type} value={value} onChange={onChange} required={required} data-testid={`input-${label}`}/></label>; }

export function OrdersPage() {
  const { formatPrice } = useStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
   const params = { email: email.trim() || undefined, phone };
  const query = useListStoreOrders(params, { query: { enabled: submitted, queryKey: getListStoreOrdersQueryKey(params) } });
   return <><NoIndex/><div className="container orders-page"><Breadcrumbs items={[{ label: 'الطلبات' }]}/><PageHeading title="تتبع طلباتك" description="استخدم رقم الهاتف، ويمكنك إضافة البريد الإلكتروني إذا توفر."/><div className="lookup-card"><h2>البحث عن طلب</h2><p>نستخدم رقم الهاتف للتحقق من طلباتك، والبريد يساعد على تضييق النتائج.</p><form className="lookup-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label className="form-field"><span>رقم الهاتف</span><input placeholder="مثلاً: 771106977" value={phone} onChange={(event) => setPhone(event.target.value)} required data-testid="input-orders-phone"/></label><label className="form-field"><span>البريد الإلكتروني <small className="field-optional">اختياري</small></span><input type="email" placeholder="example@email.com" value={email} onChange={(event) => setEmail(event.target.value)} data-testid="input-orders-email"/></label><button className="button button-primary" type="submit" data-testid="button-lookup-orders">عرض الطلبات</button></form></div>{submitted && query.isLoading && <LoadingCatalog/>}{submitted && query.isError && <div className="state-panel error-panel"><h3>لم نعثر على الطلبات بهذه البيانات</h3><p>راجع رقم الهاتف والبريد إن أدخلته ثم حاول مرة أخرى.</p></div>}{submitted && query.data?.orders?.length === 0 && <div className="empty-state"><h3>لا توجد طلبات مرتبطة بهذه البيانات</h3><p>يمكنك العودة للمتجر وبدء طلب جديد.</p></div>}{query.data?.orders && query.data.orders.length > 0 && <div className="orders-list">{query.data.orders.map((order) => <div className="order-row" key={order.id} data-testid={`row-order-${order.id}`}><div><strong>طلب #{order.id}</strong><small>{new Date(order.createdAt).toLocaleDateString('ar-YE')}</small></div><span className="status-badge">{order.status}</span><div><strong>{formatPrice(order.total)}</strong><Link href={`/order/${order.id}?phone=${encodeURIComponent(phone)}`} className="button button-quiet" data-testid={`link-order-${order.id}`}>التفاصيل <ChevronLeft size={14}/></Link></div></div>)}</div>}</div></>;
}

export function OrderPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryPhone = new URLSearchParams(window.location.search).get('phone') || '';
  const { formatPrice } = useStore();
  const [phone, setPhone] = useState(queryPhone);
  const [submitted, setSubmitted] = useState(Boolean(queryPhone));
  const query = useGetStoreOrder(id, { phone }, { query: { enabled: submitted && Boolean(phone), queryKey: getGetStoreOrderQueryKey(id, { phone }) } });
  if (!submitted || !phone) return <><NoIndex/><div className="container orders-page"><div className="lookup-card" style={{ marginTop: 70 }}><h2>تحقق من الطلب #{id}</h2><p>أدخل رقم الهاتف المستخدم عند الطلب لعرض تفاصيله.</p><form className="lookup-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><input placeholder="رقم الهاتف" value={phone} onChange={(event) => setPhone(event.target.value)} required data-testid="input-order-phone"/><button className="button button-primary" type="submit" data-testid="button-lookup-order">عرض الطلب</button></form></div></div></>;
  if (query.isLoading) return <><NoIndex/><div className="container"><LoadingCatalog/></div></>;
  if (query.isError || !query.data) return <><NoIndex/><div className="container orders-page"><div className="state-panel"><h3>تعذر العثور على هذا الطلب</h3><Link href="/orders" className="button button-primary" data-testid="link-order-retry">العودة لتتبع الطلبات</Link></div></div></>;
  const order = query.data;
  return <><NoIndex/><div className="container confirmation-page"><Breadcrumbs items={[{ label: 'الطلبات', href: '/orders' }, { label: `طلب #${order.id}` }]}/><div className="confirmation-hero"><Check size={40}/><h1>تم استلام طلبك</h1><p>شكراً لثقتك في CABL. احتفظ برقم الطلب للمتابعة.</p><strong data-testid="text-order-id">#{order.id}</strong></div><div className="confirmation-grid"><div className="detail-list"><h2>تفاصيل المنتجات</h2>{order.items.map((item) => <div className="order-item" key={item.productId}><span>{item.productName} × {item.quantity}</span><b>{formatPrice(item.price * item.quantity)}</b></div>)}</div><div className="detail-list"><h2>ملخص الدفع</h2><div className="summary-row"><span>المجموع</span><b>{formatPrice(order.subtotal)}</b></div><div className="summary-row"><span>الشحن</span><b>{formatPrice(order.shippingCost)}</b></div><div className="summary-row total"><span>الإجمالي</span><b>{formatPrice(order.total)}</b></div><div className="notice">حالة الدفع: {order.paymentStatus} · طريقة الدفع: {order.paymentMethodName}</div><Link href="/search" className="button button-primary" data-testid="link-order-continue">متابعة التسوق <ArrowLeft size={16}/></Link></div></div></div></>;
}